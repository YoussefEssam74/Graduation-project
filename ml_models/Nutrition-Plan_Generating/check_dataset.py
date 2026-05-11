"""Quick sanity-check for the cleaned gen5 SFT dataset."""
import pandas as pd
import json
import re

TRAIN_CSV = "nutrition_sft_train.csv"
EVAL_CSV = "nutrition_sft_eval.csv"

LABEL_RE = re.compile(r"[Dd]aily calorie target:\s*(\d[\d,]+)")
KCAL_RE = re.compile(
    r"(\d[\d,]+)\s*(?:kcal|calories|calorie|kcals)", re.IGNORECASE)


def parse_target(user_msg):
    m = LABEL_RE.search(user_msg)
    if m:
        return float(m.group(1).replace(",", ""))
    m = KCAL_RE.search(user_msg)
    if m:
        return float(m.group(1).replace(",", ""))
    return None


def check_file(path, label):
    df = pd.read_csv(path)
    print(f"\n{'='*60}")
    print(f"FILE: {label}  ({len(df)} rows)")
    print(f"{'='*60}")

    # Null check
    nulls = df["messages"].isnull().sum()
    print(f"Null messages : {nulls}")

    json_rows = []
    non_json = 0
    bad_parse = 0
    bad_roles = 0
    bad_len = 0

    for i, row in df.iterrows():
        try:
            msgs = json.loads(row["messages"])
        except Exception:
            bad_parse += 1
            continue
        if not isinstance(msgs, list) or len(msgs) != 3:
            bad_len += 1
            continue
        roles = [m.get("role") for m in msgs]
        if roles != ["system", "user", "assistant"]:
            bad_roles += 1
            continue
        sys_ = msgs[0]["content"]
        if "Output ONLY valid JSON" in sys_:
            json_rows.append(msgs)
        else:
            non_json += 1

    print(f"JSON-plan rows : {len(json_rows)}")
    print(f"Non-JSON rows  : {non_json}")
    print(f"Bad JSON parse : {bad_parse}")
    print(f"Wrong # turns  : {bad_len}")
    print(f"Wrong roles    : {bad_roles}")

    # --- P1: assistant must be parseable JSON with 'days' key ---
    p1_fail = 0
    for msgs in json_rows:
        try:
            plan = json.loads(msgs[2]["content"])
            assert "days" in plan
        except Exception:
            p1_fail += 1
    print(
        f"\nP1 failures    : {p1_fail} / {len(json_rows)} ({p1_fail/max(len(json_rows),1)*100:.2f}%)")

    # --- P2: any day total outside [500, 6000] kcal ---
    p2_fail = 0
    for msgs in json_rows:
        try:
            plan = json.loads(msgs[2]["content"])
            for day in plan.get("days", []):
                tc = day.get("total_calories", 0)
                if tc > 6000 or tc < 500:
                    p2_fail += 1
                    break
        except Exception:
            pass
    print(
        f"P2 failures    : {p2_fail} / {len(json_rows)} ({p2_fail/max(len(json_rows),1)*100:.2f}%)")

    # --- P3: avg day kcal deviates >20% from target ---
    p3_fail = 0
    p3_no_target = 0
    p3_samples = []
    for msgs in json_rows:
        user_msg = msgs[1]["content"]
        target = parse_target(user_msg)
        if target is None:
            p3_no_target += 1
            continue
        try:
            plan = json.loads(msgs[2]["content"])
            days = plan.get("days", [])
            if not days:
                continue
            day_cals = [d.get("total_calories", 0) for d in days]
            avg_cal = sum(day_cals) / len(day_cals)
            dev = abs(avg_cal - target) / target
            if dev > 0.20:
                p3_fail += 1
                if len(p3_samples) < 5:
                    p3_samples.append(
                        f"    target={target:.0f}, avg={avg_cal:.0f}, dev={dev*100:.1f}%"
                    )
        except Exception:
            pass
    print(
        f"P3 failures    : {p3_fail} / {len(json_rows)} ({p3_fail/max(len(json_rows),1)*100:.2f}%)")
    if p3_no_target:
        print(f"  (no target found in {p3_no_target} rows)")
    for s in p3_samples:
        print(s)

    # --- Deviation histogram for json rows ---
    devs = []
    for msgs in json_rows:
        user_msg = msgs[1]["content"]
        target = parse_target(user_msg)
        if target is None:
            continue
        try:
            plan = json.loads(msgs[2]["content"])
            days = plan.get("days", [])
            if not days:
                continue
            avg_cal = sum(d.get("total_calories", 0) for d in days) / len(days)
            devs.append(abs(avg_cal - target) / target * 100)
        except Exception:
            pass
    if devs:
        devs.sort()
        n = len(devs)
        print(f"\nCalorie deviation (|avg_day - target| / target):")
        print(
            f"  min={devs[0]:.1f}%  p50={devs[n//2]:.1f}%  p90={devs[int(n*0.9)]:.1f}%  p95={devs[int(n*0.95)]:.1f}%  max={devs[-1]:.1f}%")
        buckets = [0, 0, 0, 0]  # <5%, 5-10%, 10-20%, >20%
        for d in devs:
            if d < 5:
                buckets[0] += 1
            elif d < 10:
                buckets[1] += 1
            elif d < 20:
                buckets[2] += 1
            else:
                buckets[3] += 1
        print(f"  <5%  : {buckets[0]} ({buckets[0]/n*100:.1f}%)")
        print(f"  5-10%: {buckets[1]} ({buckets[1]/n*100:.1f}%)")
        print(f"  10-20%:{buckets[2]} ({buckets[2]/n*100:.1f}%)")
        print(f"  >20% : {buckets[3]} ({buckets[3]/n*100:.1f}%)")

    # --- Message length distribution ---
    char_lens = [len(row["messages"]) for _, row in df.iterrows()]
    char_lens.sort()
    n = len(char_lens)
    print(f"\nMessage length (chars):")
    print(f"  min={char_lens[0]}  p25={char_lens[n//4]}  median={char_lens[n//2]}  p75={char_lens[3*n//4]}  p95={char_lens[int(n*0.95)]}  max={char_lens[-1]}")


check_file(TRAIN_CSV, "TRAIN")
check_file(EVAL_CSV,  "EVAL")

print("\n[OK] Check complete.")
