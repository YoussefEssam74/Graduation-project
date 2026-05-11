"""
injury_rules_engine.py
======================

Role
----
Pre-processing guard that sits **before** the workout-plan generator model in
the inference pipeline.  It receives structured injury data reported by the
user, applies a battery of deterministic if/else rules, and returns an
``InjuryDecision`` object that tells the downstream model exactly which
movement patterns are safe, restricted, or forbidden — and by how much load
and range-of-motion should be dialled back.

Design Principles
-----------------
1. **Deterministic** – identical inputs always produce identical outputs.
   No randomness, no learned weights, no external calls.
2. **Explainable** – every restriction is traceable to a named rule and a
   plain-English coaching note.  The ``explain()`` method surfaces the full
   reasoning to the user-facing API.
3. **Conservative** – when information is ambiguous or missing, the engine
   defaults to the more protective restriction (i.e. MODERATE severity when
   unknown, SUBACUTE duration when unknown).
4. **ACSM-aligned** – restriction thresholds and substitution guidance follow
   the American College of Sports Medicine's return-to-activity guidelines and
   general clinical exercise physiology principles.

API Flow
--------
::

    [API Request]
         │
         ▼
    InjuryRulesEngine.from_dict(raw_dict)  →  InjuryInput
         │
         ▼
    InjuryRulesEngine.evaluate([InjuryInput, ...])  →  InjuryDecision
         │  (red-flag check + region-specific rules + merge)
         ▼
    InjuryRulesEngine.filter_exercises(exercise_pool, decision)
         │  (removes contraindicated, annotates restricted)
         ▼
    [Filtered exercise pool]  →  Workout Generator Model
         │
         ▼
    InjuryRulesEngine.explain(decision)  →  str  →  User-facing note

Modules used
------------
Only Python standard library: ``dataclasses``, ``enum``, ``typing``, ``json``.
No ML / numerical libraries required.
"""

from __future__ import annotations

import io
import json
import sys
from dataclasses import dataclass, field
from enum import Enum
from typing import Callable, Dict, List, Optional, Set

# ══════════════════════════════════════════════════════════════════════════════
#  ENUMERATIONS
# ══════════════════════════════════════════════════════════════════════════════


class InjuryRegion(str, Enum):
    """Anatomical region of the reported injury."""

    SHOULDER = "shoulder"
    KNEE = "knee"
    LOWER_BACK = "lower_back"
    UPPER_BACK = "upper_back"
    ELBOW = "elbow"
    WRIST = "wrist"
    ANKLE = "ankle"
    HIP = "hip"
    NECK = "neck"


class InjuryType(str, Enum):
    """Clinical classification of the injury mechanism / pathology."""

    PAIN = "pain"
    STRAIN = "strain"
    IMPINGEMENT = "impingement"
    TENDINITIS = "tendinitis"
    SPRAIN = "sprain"
    POST_OP = "post_op"
    FRACTURE = "fracture"
    DISLOCATION = "dislocation"
    UNKNOWN = "unknown"


class Severity(str, Enum):
    """Self-reported or clinician-assessed severity level."""

    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"


class DurationCategory(str, Enum):
    """
    Time since injury onset, bucketed into clinical phases.

    ACUTE    : 0 – 3 days   (inflammatory phase)
    SUBACUTE : 3 – 21 days  (proliferative / repair phase)
    CHRONIC  : 21+ days     (remodelling / persistent phase)
    """

    ACUTE = "acute"
    SUBACUTE = "subacute"
    CHRONIC = "chronic"


class ROMModifier(str, Enum):
    """
    Ordered from least to most restrictive.
    Used to communicate allowable range-of-motion to the coach / model.
    """

    FULL = "full"
    PARTIAL = "partial"
    PAIN_FREE_ONLY = "pain_free_only"
    NONE_UNTIL_CLEARED = "none_until_cleared"


# ── ROM ordering helper ────────────────────────────────────────────────────────

_ROM_RESTRICTIVENESS: Dict[ROMModifier, int] = {
    ROMModifier.FULL: 0,
    ROMModifier.PARTIAL: 1,
    ROMModifier.PAIN_FREE_ONLY: 2,
    ROMModifier.NONE_UNTIL_CLEARED: 3,
}


def _more_restrictive_rom(a: ROMModifier, b: ROMModifier) -> ROMModifier:
    """Return whichever ROMModifier is the more restrictive of the two."""
    return a if _ROM_RESTRICTIVENESS[a] >= _ROM_RESTRICTIVENESS[b] else b


# ══════════════════════════════════════════════════════════════════════════════
#  DATACLASSES
# ══════════════════════════════════════════════════════════════════════════════


@dataclass
class InjuryInput:
    """
    Structured representation of a single injury reported by the user.

    All fields are required; use ``InjuryRulesEngine.from_dict()`` to parse
    raw API payloads with safe defaults.

    Fields
    ------
    injury_region          : Anatomical region affected.
    injury_type            : Clinical classification.
    severity               : MILD / MODERATE / SEVERE.
    duration_category      : Phase of healing (ACUTE / SUBACUTE / CHRONIC).
    pain_now               : Current pain on the 0-10 NRS scale.
    pain_with_daily_activity : True if pain occurs during normal daily tasks.
    range_of_motion_limited : True if measurable ROM loss is present.
    doctor_cleared         : True if a physician has cleared the user for exercise.
    currently_in_physio    : True if currently receiving physiotherapy.
    movements_that_hurt    : Free-text list of aggravating movements.
    recent_trauma          : True if injury occurred within the past 72 hours.
    unexplained_swelling   : True if swelling is present without clear cause.
    major_weakness         : True if significant muscle/strength deficit is noted.
    systemic_symptoms      : True if fever, fatigue, or widespread pain coexist.
    worsening              : True if symptoms have been getting progressively worse.
    """

    injury_region: InjuryRegion
    injury_type: InjuryType
    severity: Severity
    duration_category: DurationCategory
    pain_now: int  # 0 – 10 NRS
    pain_with_daily_activity: bool
    range_of_motion_limited: bool
    doctor_cleared: bool
    currently_in_physio: bool
    movements_that_hurt: List[str]
    recent_trauma: bool
    unexplained_swelling: bool
    major_weakness: bool
    systemic_symptoms: bool
    worsening: bool


@dataclass
class InjuryDecision:
    """
    Output of ``InjuryRulesEngine.evaluate()``.

    Downstream consumers (workout generator model and API layer) MUST:

    1. Exclude any exercise whose ``movement_pattern`` is in
       ``contraindicated_patterns``.
    2. Flag any exercise in ``restricted_patterns`` with an ``injury_note``
       and apply ``load_modifier`` to its prescribed load.
    3. Apply ``rom_modifier`` to execution cues for every exercise.
    4. If ``requires_clearance`` is True, surface ``clearance_reasons`` to the
       user and restrict the programme to safe / physio-approved movements only.

    Fields
    ------
    requires_clearance       : True if medical/physio sign-off is mandatory.
    clearance_reasons        : Explanatory strings driving the clearance flag.
    contraindicated_patterns : Movement patterns that MUST be excluded entirely.
    restricted_patterns      : Patterns permitted with modified load/ROM.
    allowed_patterns         : Remaining unrestricted patterns (auto-computed).
    load_modifier            : Multiply prescribed load by this factor (0.0 – 1.0).
    rom_modifier             : ROM constraint to apply across all exercises.
    coaching_notes           : Human-readable instructions for each region rule.
    red_flags                : Critical safety alerts requiring immediate action.
    substitutions            : {avoided_pattern: recommended_substitute_pattern}.
    tags                     : Machine-readable labels for downstream filtering.
    """

    requires_clearance: bool = False
    clearance_reasons: List[str] = field(default_factory=list)
    contraindicated_patterns: Set[str] = field(default_factory=set)
    restricted_patterns: Set[str] = field(default_factory=set)
    allowed_patterns: Set[str] = field(default_factory=set)
    load_modifier: float = 1.0  # 1.0 = no restriction
    rom_modifier: ROMModifier = ROMModifier.FULL
    coaching_notes: List[str] = field(default_factory=list)
    red_flags: List[str] = field(default_factory=list)
    substitutions: Dict[str, str] = field(default_factory=dict)
    tags: List[str] = field(default_factory=list)


# ══════════════════════════════════════════════════════════════════════════════
#  CONSTANTS
# ══════════════════════════════════════════════════════════════════════════════

ALL_PATTERNS: Set[str] = {
    "squat",
    "hip_hinge",
    "horizontal_push",
    "vertical_push",
    "vertical_pull",
    "horizontal_pull",
    "lunge",
    "elbow_flexion",
    "elbow_extension",
    "knee_extension",
    "knee_flexion",
    "calf",
    "shoulder_raise",
    "core_flexion",
}

# Injury types that unconditionally trigger the clearance requirement flag.
RED_FLAG_INJURY_TYPES: Set[InjuryType] = {
    InjuryType.POST_OP,
    InjuryType.FRACTURE,
    InjuryType.DISLOCATION,
}


# ══════════════════════════════════════════════════════════════════════════════
#  RULES ENGINE
# ══════════════════════════════════════════════════════════════════════════════


class InjuryRulesEngine:
    """
    Deterministic, rule-based injury screening engine.

    Responsibilities
    ----------------
    - Detect clinical red flags that require medical clearance before exercise.
    - Apply region-specific, severity-stratified restriction rules.
    - Merge decisions from multiple concurrent injuries (most-restrictive wins).
    - Filter a concrete exercise pool and annotate restricted entries.
    - Produce human-readable explanations for the API response layer.

    No state is stored between calls; all methods are pure functions over their
    arguments except for the ``_REGION_DISPATCH`` lookup table.
    """

    # ──────────────────────────────────────────────────────────────────────────
    #  RED-FLAG DETECTION
    # ──────────────────────────────────────────────────────────────────────────

    def _check_red_flags(self, injury: InjuryInput) -> List[str]:
        """
        Screen for clinical red flags that contraindicate unsupervised exercise.

        Returns a (possibly empty) list of plain-English flag descriptions.
        Any non-empty return value will set ``requires_clearance = True`` on
        the merged decision.

        Triggers
        --------
        - pain_now >= 8
        - injury_type in {POST_OP, FRACTURE, DISLOCATION}
        - recent_trauma AND severity != MILD
        - unexplained_swelling
        - major_weakness
        - systemic_symptoms
        - worsening AND duration_category != ACUTE
        """
        flags: List[str] = []

        if injury.pain_now >= 8:
            flags.append(
                f"Pain level {injury.pain_now}/10 is too high for unsupervised exercise "
                "(threshold: 8/10).  Rest and seek medical evaluation."
            )

        if injury.injury_type in RED_FLAG_INJURY_TYPES:
            flags.append(
                f"Injury type '{injury.injury_type.value}' (region: {injury.injury_region.value}) "
                "requires documented medical clearance before any structured training."
            )

        if injury.recent_trauma and injury.severity != Severity.MILD:
            flags.append(
                "Recent trauma (within 72 h) combined with moderate-to-severe severity "
                "requires medical evaluation before loading the affected region."
            )

        if injury.unexplained_swelling:
            flags.append(
                "Unexplained swelling is a red flag — could indicate acute synovitis, "
                "haematoma, or infection.  Do not exercise until cause is identified."
            )

        if injury.major_weakness:
            flags.append(
                "Significant muscle strength deficit detected — possible nerve impingement, "
                "muscle tear, or structural damage.  Neurological screening recommended."
            )

        if injury.systemic_symptoms:
            flags.append(
                "Systemic symptoms (fever, widespread pain, fatigue) contraindicate exercise. "
                "Seek medical review to rule out systemic or inflammatory pathology."
            )

        if injury.worsening and injury.duration_category != DurationCategory.ACUTE:
            flags.append(
                f"Progressive worsening of a {injury.duration_category.value} injury "
                "suggests inadequate recovery or underlying pathology.  Reassessment required."
            )

        return flags

    # ──────────────────────────────────────────────────────────────────────────
    #  REGION-SPECIFIC RULES
    # ──────────────────────────────────────────────────────────────────────────

    def _shoulder_rules(self, injury: InjuryInput, decision: InjuryDecision) -> None:
        """
        Shoulder injury restrictions (ACSM shoulder-impingement and rotator-cuff
        return-to-activity guidelines).

        MILD     → restrict overhead; reduce load 25 %
        MODERATE → ban all overhead; restrict horizontal pressing/pulling
        SEVERE   → ban all upper-body pushing; medical clearance required
        """
        if injury.severity == Severity.MILD:
            decision.restricted_patterns.update({"vertical_push", "shoulder_raise"})
            decision.load_modifier = min(decision.load_modifier, 0.75)
            decision.rom_modifier = _more_restrictive_rom(
                decision.rom_modifier, ROMModifier.PAIN_FREE_ONLY
            )
            decision.coaching_notes.append(
                "[Shoulder – Mild] Reduce overhead pressing load 25 %.  Stop if pain > 3/10.  "
                "Prefer neutral-grip pressing over pronated.  No kipping movements or "
                "ballistic shoulder actions."
            )
            decision.substitutions.update({"vertical_push": "horizontal_push"})
            decision.tags.extend(["reduce_overhead_load", "pain_free_rom"])

        elif injury.severity == Severity.MODERATE:
            decision.contraindicated_patterns.update(
                {"vertical_push", "shoulder_raise"}
            )
            decision.restricted_patterns.update({"horizontal_push", "horizontal_pull"})
            decision.load_modifier = min(decision.load_modifier, 0.60)
            decision.rom_modifier = _more_restrictive_rom(
                decision.rom_modifier, ROMModifier.PARTIAL
            )
            decision.coaching_notes.append(
                "[Shoulder – Moderate] Avoid ALL overhead pressing.  Machine chest press "
                "preferred over barbell flat bench.  No upright rows or dips behind neck.  "
                "Pain-free cable/machine rows only — stop if shoulder impingement occurs."
            )
            decision.substitutions.update(
                {
                    "vertical_push": "horizontal_push",
                    "shoulder_raise": "core_flexion",
                }
            )
            decision.tags.extend(
                ["no_overhead", "machine_preferred", "avoid_upright_rows"]
            )

        else:  # SEVERE
            decision.contraindicated_patterns.update(
                {"vertical_push", "shoulder_raise", "horizontal_push"}
            )
            decision.restricted_patterns.update({"horizontal_pull"})
            decision.load_modifier = min(decision.load_modifier, 0.50)
            decision.rom_modifier = _more_restrictive_rom(
                decision.rom_modifier, ROMModifier.NONE_UNTIL_CLEARED
            )
            decision.requires_clearance = True
            decision.clearance_reasons.append(
                "Severe shoulder injury — all upper-body pushing is contraindicated until "
                "the treating physician or physiotherapist provides written clearance."
            )
            decision.coaching_notes.append(
                "[Shoulder – Severe] Medical clearance required before any upper-body "
                "pushing.  Lower body and seated cable pulling are permitted within a "
                "completely pain-free range only.  Abort set immediately on any shoulder pain."
            )
            decision.tags.extend(["clearance_required", "upper_body_restricted"])

    # ──────────────────────────────────────────────────────────────────────────

    def _knee_rules(self, injury: InjuryInput, decision: InjuryDecision) -> None:
        """
        Knee injury restrictions (ACSM patellofemoral and ACL return-to-sport
        load-management guidelines).

        MILD     → restrict squats/lunges; limit depth
        MODERATE → ban lunges; restrict knee-isolation work
        SEVERE   → ban all direct leg patterns; medical clearance required
        """
        if injury.severity == Severity.MILD:
            decision.restricted_patterns.update({"squat", "lunge"})
            decision.load_modifier = min(decision.load_modifier, 0.75)
            decision.rom_modifier = _more_restrictive_rom(
                decision.rom_modifier, ROMModifier.PARTIAL
            )
            decision.coaching_notes.append(
                "[Knee – Mild] Limit squat depth to pain-free range (typically above parallel).  "
                "Avoid jumping and plyometric loading.  Leg press preferred over barbell squat.  "
                "Monitor for post-session swelling — if present, reduce load further next session."
            )
            decision.substitutions.update(
                {
                    "squat": "squat (half-depth, controlled tempo)",
                    "lunge": "hip_hinge",
                }
            )
            decision.tags.extend(["limit_squat_depth", "no_plyometrics"])

        elif injury.severity == Severity.MODERATE:
            decision.contraindicated_patterns.update({"lunge"})
            decision.restricted_patterns.update(
                {"squat", "knee_extension", "knee_flexion"}
            )
            decision.load_modifier = min(decision.load_modifier, 0.60)
            decision.rom_modifier = _more_restrictive_rom(
                decision.rom_modifier, ROMModifier.PAIN_FREE_ONLY
            )
            decision.coaching_notes.append(
                "[Knee – Moderate] Replace barbell squats with leg press or box squat.  "
                "No lunges in any variation.  Seated leg curl only if completely pain-free — "
                "otherwise omit.  Focus programme on upper body and hip-hinge patterns that "
                "do not stress the knee joint."
            )
            decision.substitutions.update(
                {
                    "squat": "hip_hinge",
                    "lunge": "hip_hinge",
                }
            )
            decision.tags.extend(["no_lunges", "leg_press_preferred"])

        else:  # SEVERE
            decision.contraindicated_patterns.update(
                {"squat", "lunge", "knee_extension", "knee_flexion", "calf"}
            )
            decision.restricted_patterns.update({"hip_hinge"})
            decision.requires_clearance = True
            decision.clearance_reasons.append(
                "Severe knee injury — all direct leg loading is contraindicated until "
                "a physiotherapist clears progressive weight-bearing."
            )
            decision.load_modifier = min(decision.load_modifier, 0.50)
            decision.rom_modifier = _more_restrictive_rom(
                decision.rom_modifier, ROMModifier.NONE_UNTIL_CLEARED
            )
            decision.coaching_notes.append(
                "[Knee – Severe] No direct leg work until physiotherapist clearance.  "
                "Upper body and seated exercises only.  Hip hinges permitted only if the "
                "knee is completely unloaded and pain-free throughout the movement."
            )
            decision.tags.extend(["clearance_required", "upper_body_only"])

    # ──────────────────────────────────────────────────────────────────────────

    def _lower_back_rules(self, injury: InjuryInput, decision: InjuryDecision) -> None:
        """
        Lumbar spine restrictions (ACSM low-back pain exercise prescription
        and McGill spinal-stability guidelines).

        MILD     → restrict hip hinge / squat; demand neutral spine
        MODERATE → ban free-weight hip hinge; restrict squat and row
        SEVERE   → ban all axial loading; medical clearance required
        """
        if injury.severity == Severity.MILD:
            decision.restricted_patterns.update({"hip_hinge", "squat"})
            decision.load_modifier = min(decision.load_modifier, 0.70)
            decision.rom_modifier = _more_restrictive_rom(
                decision.rom_modifier, ROMModifier.PAIN_FREE_ONLY
            )
            decision.coaching_notes.append(
                "[Lower Back – Mild] Brace core (intra-abdominal pressure) on ALL movements.  "
                "Avoid any spinal rounding or flexion under load.  Prefer Romanian deadlift "
                "over conventional deadlift.  Eliminate good mornings, hyperextensions, and "
                "Jefferson curls from the session."
            )
            decision.substitutions.update(
                {
                    "hip_hinge": "hip_hinge (light load, strict neutral spine only)",
                }
            )
            decision.tags.extend(["brace_core", "neutral_spine_only", "rdl_preferred"])

        elif injury.severity == Severity.MODERATE:
            decision.contraindicated_patterns.update({"hip_hinge"})
            decision.restricted_patterns.update({"squat", "horizontal_pull"})
            decision.load_modifier = min(decision.load_modifier, 0.55)
            decision.rom_modifier = _more_restrictive_rom(
                decision.rom_modifier, ROMModifier.PARTIAL
            )
            decision.coaching_notes.append(
                "[Lower Back – Moderate] Remove ALL free-weight deadlift variations.  Use "
                "hip thrust or cable pull-through as hip-extension alternatives.  Eliminate "
                "bent-over rows — substitute with seated cable row (supported lumbar).  "
                "Leg press preferred over barbell squat to reduce spinal compression."
            )
            decision.substitutions.update(
                {
                    "hip_hinge": "core_flexion",
                    "horizontal_pull": "horizontal_pull (seated cable, supported back only)",
                }
            )
            decision.tags.extend(
                ["no_deadlift", "seated_cable_rows_only", "machine_preferred"]
            )

        else:  # SEVERE
            decision.contraindicated_patterns.update({"hip_hinge", "squat", "lunge"})
            decision.restricted_patterns.update({"core_flexion", "horizontal_pull"})
            decision.requires_clearance = True
            decision.clearance_reasons.append(
                "Severe lower back injury — axial spinal loading is contraindicated.  "
                "Medical imaging and specialist clearance required before resuming "
                "any free-weight compound lower-body or posterior-chain work."
            )
            decision.load_modifier = min(decision.load_modifier, 0.40)
            decision.rom_modifier = _more_restrictive_rom(
                decision.rom_modifier, ROMModifier.NONE_UNTIL_CLEARED
            )
            decision.coaching_notes.append(
                "[Lower Back – Severe] Medical clearance required.  Supine and seated exercises "
                "only.  Zero axial spinal loading (no bar on back, no standing lifts).  "
                "Focus exclusively on pain-free upper-body pressing and pulling in supported "
                "positions."
            )
            decision.tags.extend(
                ["clearance_required", "no_axial_load", "supine_seated_only"]
            )

    # ──────────────────────────────────────────────────────────────────────────

    def _elbow_rules(self, injury: InjuryInput, decision: InjuryDecision) -> None:
        """
        Elbow injury restrictions (lateral/medial epicondylitis and elbow
        tendinopathy management guidelines).

        MILD     → restrict direct arm work; reduce volume 35 %
        MODERATE → ban all arm isolation; restrict compounds
        SEVERE   → rest elbow completely; medical clearance required
        """
        if injury.severity == Severity.MILD:
            decision.restricted_patterns.update({"elbow_flexion", "elbow_extension"})
            decision.load_modifier = min(decision.load_modifier, 0.65)
            decision.rom_modifier = _more_restrictive_rom(
                decision.rom_modifier, ROMModifier.PAIN_FREE_ONLY
            )
            decision.coaching_notes.append(
                "[Elbow – Mild] Reduce direct arm isolation volume by 35 %.  Use a neutral "
                "(hammer) grip wherever possible.  Avoid full elbow lock-out on extension "
                "exercises (stop 10–15° short of full extension).  "
                "Ice elbow for 10 min post-session if soreness persists."
            )
            decision.tags.extend(
                ["neutral_grip", "reduce_arm_volume", "avoid_elbow_lockout"]
            )

        elif injury.severity == Severity.MODERATE:
            decision.contraindicated_patterns.update(
                {"elbow_flexion", "elbow_extension"}
            )
            decision.restricted_patterns.update({"horizontal_push", "horizontal_pull"})
            decision.load_modifier = min(decision.load_modifier, 0.60)
            decision.rom_modifier = _more_restrictive_rom(
                decision.rom_modifier, ROMModifier.PARTIAL
            )
            decision.coaching_notes.append(
                "[Elbow – Moderate] Skip ALL direct arm isolation exercises.  Compound "
                "pressing (bench) and pulling (row) permitted only if completely pain-free "
                "throughout the full movement.  Use wrist wraps if gripping under load "
                "aggravates symptoms.  Monitor for pain radiation into forearm or wrist."
            )
            decision.substitutions.update(
                {
                    "elbow_flexion": "horizontal_pull",
                    "elbow_extension": "horizontal_push",
                }
            )
            decision.tags.extend(
                ["no_arm_isolation", "compounds_only", "wrist_wraps_advised"]
            )

        else:  # SEVERE
            decision.contraindicated_patterns.update(
                {
                    "elbow_flexion",
                    "elbow_extension",
                    "horizontal_push",
                    "horizontal_pull",
                }
            )
            decision.requires_clearance = True
            decision.clearance_reasons.append(
                "Severe elbow injury — complete elbow rest required.  "
                "Medical review needed before resuming any upper-body pushing or pulling."
            )
            decision.load_modifier = min(decision.load_modifier, 0.50)
            decision.rom_modifier = _more_restrictive_rom(
                decision.rom_modifier, ROMModifier.NONE_UNTIL_CLEARED
            )
            decision.coaching_notes.append(
                "[Elbow – Severe] Rest elbow completely — no grip-loaded upper-body work.  "
                "Lower body and core exercises only.  Medical review required before returning "
                "to any pushing, pulling, or carrying exercise."
            )
            decision.tags.extend(
                ["clearance_required", "elbow_rest", "lower_body_core_only"]
            )

    # ──────────────────────────────────────────────────────────────────────────

    def _wrist_rules(self, injury: InjuryInput, decision: InjuryDecision) -> None:
        """
        Wrist injury restrictions (TFCC, carpal tunnel, and wrist tendinopathy
        exercise modification protocols).

        MILD     → restrict horizontal pressing; use neutral grip + wraps
        MODERATE → ban pressing; restrict pulling and curls; cables/machines only
        SEVERE   → ban all grip-intensive pushing and pulling; clearance required
        """
        if injury.severity == Severity.MILD:
            decision.restricted_patterns.update({"horizontal_push"})
            decision.load_modifier = min(decision.load_modifier, 0.75)
            decision.rom_modifier = _more_restrictive_rom(
                decision.rom_modifier, ROMModifier.PAIN_FREE_ONLY
            )
            decision.coaching_notes.append(
                "[Wrist – Mild] Use neutral grip wherever possible.  Wear wrist wraps on all "
                "pressing movements.  Avoid extreme wrist extension under load (flat bar bench).  "
                "Reduce pressing volume by 25 %.  Dumbbell pressing preferred over barbell."
            )
            decision.substitutions.update(
                {
                    "horizontal_push": "horizontal_push (neutral-grip dumbbells or cable press)",
                }
            )
            decision.tags.extend(
                ["neutral_grip", "wrist_wraps_recommended", "dumbbell_over_barbell"]
            )

        elif injury.severity == Severity.MODERATE:
            decision.contraindicated_patterns.update({"horizontal_push"})
            decision.restricted_patterns.update({"elbow_flexion", "horizontal_pull"})
            decision.load_modifier = min(decision.load_modifier, 0.60)
            decision.rom_modifier = _more_restrictive_rom(
                decision.rom_modifier, ROMModifier.PARTIAL
            )
            decision.coaching_notes.append(
                "[Wrist – Moderate] No barbell or dumbbell pressing — cables and machines with "
                "neutral grip only.  Minimise wrist flexion/extension under any load.  "
                "Avoid heavy gripping exercises (shrugs, farmer carries, heavy pull-downs).  "
                "Straps permitted for pulling movements if wrist is pain-free when used."
            )
            decision.substitutions.update(
                {
                    "horizontal_push": "vertical_pull",
                    "horizontal_pull": "horizontal_pull (cable, neutral grip with straps)",
                }
            )
            decision.tags.extend(
                ["cables_machines_only", "no_barbell_pressing", "straps_permitted"]
            )

        else:  # SEVERE
            decision.contraindicated_patterns.update(
                {"horizontal_push", "horizontal_pull", "elbow_flexion"}
            )
            decision.requires_clearance = True
            decision.clearance_reasons.append(
                "Severe wrist injury — all grip-intensive upper-body pushing and pulling "
                "is contraindicated until wrist stability and pain-free ROM are restored."
            )
            decision.load_modifier = min(decision.load_modifier, 0.50)
            decision.rom_modifier = _more_restrictive_rom(
                decision.rom_modifier, ROMModifier.NONE_UNTIL_CLEARED
            )
            decision.coaching_notes.append(
                "[Wrist – Severe] Avoid all grip-loaded exercises.  Lower body, core, and "
                "machine-isolated leg work only.  Medical clearance required before returning "
                "to any upper-body training.  Consider splinting during daily activities."
            )
            decision.tags.extend(
                ["clearance_required", "no_grip_loading", "lower_body_only"]
            )

    # ──────────────────────────────────────────────────────────────────────────

    def _ankle_rules(self, injury: InjuryInput, decision: InjuryDecision) -> None:
        """
        Ankle injury restrictions (lateral ankle sprain and Achilles tendinopathy
        progressive loading protocols).

        MILD     → restrict squats/lunges/calf; avoid impact; heel elevation
        MODERATE → ban lunges and calf; restrict squats; prefer seated
        SEVERE   → ban all weight-bearing lower-body; clearance required
        """
        if injury.severity == Severity.MILD:
            decision.restricted_patterns.update({"squat", "calf", "lunge"})
            decision.load_modifier = min(decision.load_modifier, 0.75)
            decision.rom_modifier = _more_restrictive_rom(
                decision.rom_modifier, ROMModifier.PARTIAL
            )
            decision.coaching_notes.append(
                "[Ankle – Mild] Avoid all jumping and impact activities.  Use a heel elevation "
                "(25 mm plate under heels) for squats to reduce dorsiflexion demand.  "
                "Seated calf raises only — no standing single or double calf raises.  "
                "Shorten lunge stride to reduce ankle loading.  Monitor for swelling after sessions."
            )
            decision.substitutions.update(
                {
                    "squat": "squat (heel-elevated, bilateral only)",
                    "lunge": "hip_hinge",
                    "calf": "calf (seated machine only)",
                }
            )
            decision.tags.extend(["no_impact", "heel_elevation", "seated_calf_only"])

        elif injury.severity == Severity.MODERATE:
            decision.contraindicated_patterns.update({"lunge", "calf"})
            decision.restricted_patterns.update({"squat"})
            decision.load_modifier = min(decision.load_modifier, 0.60)
            decision.rom_modifier = _more_restrictive_rom(
                decision.rom_modifier, ROMModifier.PAIN_FREE_ONLY
            )
            decision.coaching_notes.append(
                "[Ankle – Moderate] No lunges in any form (walking, reverse, lateral).  "
                "No calf raises.  Limit squat range to pain-free depth — leg press preferred.  "
                "Avoid single-leg loading entirely.  Upper body seated exercises and hip "
                "thrusts are preferred alternatives for this phase."
            )
            decision.substitutions.update(
                {
                    "lunge": "hip_hinge",
                    "calf": "hip_hinge",
                    "squat": "squat (leg press alternative)",
                }
            )
            decision.tags.extend(
                ["no_lunges", "no_calf_raises", "bilateral_only", "leg_press_preferred"]
            )

        else:  # SEVERE
            decision.contraindicated_patterns.update(
                {"squat", "lunge", "calf", "hip_hinge"}
            )
            decision.requires_clearance = True
            decision.clearance_reasons.append(
                "Severe ankle injury — all weight-bearing lower-body movement is "
                "contraindicated until bone and ligament integrity is confirmed by imaging "
                "and the treating physiotherapist clears progressive loading."
            )
            decision.load_modifier = min(decision.load_modifier, 0.50)
            decision.rom_modifier = _more_restrictive_rom(
                decision.rom_modifier, ROMModifier.NONE_UNTIL_CLEARED
            )
            decision.coaching_notes.append(
                "[Ankle – Severe] Upper body only.  No weight-bearing on injured ankle.  "
                "All exercises must be performed seated or supine.  "
                "Physiotherapist clearance and progressive weight-bearing protocol required "
                "before returning to any standing exercise."
            )
            decision.tags.extend(
                ["clearance_required", "upper_body_only", "non_weight_bearing"]
            )

    # ──────────────────────────────────────────────────────────────────────────

    def _hip_rules(self, injury: InjuryInput, decision: InjuryDecision) -> None:
        """
        Hip injury restrictions (FAI, labral tear, hip flexor strain, and
        greater trochanteric pain syndrome guidelines).

        MILD     → restrict squat/hinge/lunge; limit end-range hip positions
        MODERATE → ban all hip-dominant patterns; machine-based isolation only
        SEVERE   → ban all lower-body compound and isolation; clearance required
        """
        if injury.severity == Severity.MILD:
            decision.restricted_patterns.update({"squat", "hip_hinge", "lunge"})
            decision.load_modifier = min(decision.load_modifier, 0.70)
            decision.rom_modifier = _more_restrictive_rom(
                decision.rom_modifier, ROMModifier.PARTIAL
            )
            decision.coaching_notes.append(
                "[Hip – Mild] Limit hip flexion depth (avoid deep squat / full hip hinge).  "
                "Avoid end-range hip positions under any load.  "
                "Prefer machines over free weights to control ROM precisely.  "
                "Monitor for clicking, catching, or groin pain — stop if present."
            )
            decision.substitutions.update(
                {
                    "squat": "squat (limited depth, no below-parallel)",
                    "hip_hinge": "hip_hinge (shallow, no full hip flexion)",
                    "lunge": "core_flexion",
                }
            )
            decision.tags.extend(
                ["limit_hip_rom", "no_end_range_loading", "no_deep_squat"]
            )

        elif injury.severity == Severity.MODERATE:
            decision.contraindicated_patterns.update({"squat", "hip_hinge", "lunge"})
            decision.restricted_patterns.update({"knee_extension", "knee_flexion"})
            decision.load_modifier = min(decision.load_modifier, 0.55)
            decision.rom_modifier = _more_restrictive_rom(
                decision.rom_modifier, ROMModifier.PAIN_FREE_ONLY
            )
            decision.coaching_notes.append(
                "[Hip – Moderate] No free-weight squat, hip hinge, or lunge variations.  "
                "Machine-based knee isolation (leg extension, leg curl) permitted only if the "
                "hip setup position is entirely pain-free.  "
                "Seated exercises and upper body work are the focus for this phase."
            )
            decision.substitutions.update(
                {
                    "squat": "knee_extension",
                    "hip_hinge": "core_flexion",
                    "lunge": "core_flexion",
                }
            )
            decision.tags.extend(["no_squat_hinge_lunge", "machine_based_only"])

        else:  # SEVERE
            decision.contraindicated_patterns.update(
                {"squat", "hip_hinge", "lunge", "knee_extension", "knee_flexion"}
            )
            decision.requires_clearance = True
            decision.clearance_reasons.append(
                "Severe hip injury — all lower-body compound and isolation work is "
                "contraindicated.  Imaging (X-ray / MRI) and orthopaedic or sports-medicine "
                "specialist review required before progressive loading."
            )
            decision.load_modifier = min(decision.load_modifier, 0.40)
            decision.rom_modifier = _more_restrictive_rom(
                decision.rom_modifier, ROMModifier.NONE_UNTIL_CLEARED
            )
            decision.coaching_notes.append(
                "[Hip – Severe] No lower-body loading of any kind.  Upper body only — "
                "all exercises performed seated or supine.  "
                "Specialist review and imaging are strongly recommended before resuming."
            )
            decision.tags.extend(
                ["clearance_required", "upper_body_only", "specialist_review"]
            )

    # ──────────────────────────────────────────────────────────────────────────

    def _neck_rules(self, injury: InjuryInput, decision: InjuryDecision) -> None:
        """
        Cervical spine restrictions (cervical radiculopathy, whiplash, and
        neck muscle strain exercise modification guidelines).

        MILD     → no contraindications; reduce neck-loading movements
        MODERATE → ban overhead pressing; restrict shoulder raises and vertical pull
        SEVERE   → ban all overhead and compressive cervical loading; clearance required
        """
        if injury.severity == Severity.MILD:
            decision.load_modifier = min(decision.load_modifier, 0.80)
            decision.rom_modifier = _more_restrictive_rom(
                decision.rom_modifier, ROMModifier.PAIN_FREE_ONLY
            )
            decision.coaching_notes.append(
                "[Neck – Mild] Maintain strict neutral cervical spine on all exercises.  "
                "Avoid heavy shrugs, heavy upper-trap work, and behind-the-neck pressing or "
                "pulling.  Reduce overall upper-trap loading by 20 %.  "
                "No axial cervical compression (no barbell back squats without a foam pad)."
            )
            decision.tags.extend(
                ["neutral_neck", "avoid_neck_strain", "no_behind_neck"]
            )

        elif injury.severity == Severity.MODERATE:
            decision.contraindicated_patterns.update({"vertical_push"})
            decision.restricted_patterns.update({"shoulder_raise", "vertical_pull"})
            decision.load_modifier = min(decision.load_modifier, 0.60)
            decision.rom_modifier = _more_restrictive_rom(
                decision.rom_modifier, ROMModifier.PARTIAL
            )
            decision.coaching_notes.append(
                "[Neck – Moderate] No overhead pressing — compressive cervical force risk.  "
                "No behind-the-neck lat pulldown.  Restrict shoulder shrugs.  "
                "All exercises performed with head in neutral (no chin-tuck or jutting).  "
                "Seated, fully-supported spine preferred throughout the session."
            )
            decision.substitutions.update(
                {
                    "vertical_push": "horizontal_push",
                    "vertical_pull": "horizontal_pull",
                }
            )
            decision.tags.extend(
                ["no_overhead_press", "neutral_cervical_spine", "seated_supported"]
            )

        else:  # SEVERE
            decision.contraindicated_patterns.update(
                {"vertical_push", "shoulder_raise"}
            )
            decision.restricted_patterns.update({"vertical_pull", "horizontal_pull"})
            decision.requires_clearance = True
            decision.clearance_reasons.append(
                "Severe neck injury — all overhead and compressive cervical loading requires "
                "medical imaging (MRI/CT) and specialist clearance before exercise."
            )
            decision.load_modifier = min(decision.load_modifier, 0.50)
            decision.rom_modifier = _more_restrictive_rom(
                decision.rom_modifier, ROMModifier.NONE_UNTIL_CLEARED
            )
            decision.coaching_notes.append(
                "[Neck – Severe] Medical clearance required before any overhead or heavy "
                "upper-back loading.  Lower body and light core work permitted if pain-free.  "
                "CRITICAL: tingling, numbness, or weakness in arms/hands = stop immediately "
                "and seek emergency medical attention."
            )
            decision.tags.extend(
                ["clearance_required", "no_cervical_compression", "neurological_watch"]
            )

    # ──────────────────────────────────────────────────────────────────────────

    def _upper_back_rules(self, injury: InjuryInput, decision: InjuryDecision) -> None:
        """
        Thoracic spine / upper back restrictions (thoracic facet joint, "
        rhomboid strain, and mid-back disc guidelines).

        MILD     → restrict horizontal pulling; reduce row load
        MODERATE → ban horizontal pull; restrict vertical pull
        SEVERE   → ban all pulling patterns; medical clearance required
        """
        if injury.severity == Severity.MILD:
            decision.restricted_patterns.update({"horizontal_pull"})
            decision.load_modifier = min(decision.load_modifier, 0.75)
            decision.rom_modifier = _more_restrictive_rom(
                decision.rom_modifier, ROMModifier.PAIN_FREE_ONLY
            )
            decision.coaching_notes.append(
                "[Upper Back – Mild] Reduce rowing volume and load.  "
                "Cable rows preferred over barbell bent-over rows.  "
                "Avoid extreme scapular protraction under load.  "
                "Monitor for thoracic pain or stiffness during and after sessions."
            )
            decision.substitutions.update(
                {
                    "horizontal_pull": "horizontal_pull (seated cable, light load)",
                }
            )
            decision.tags.extend(["reduce_row_volume", "cable_rows_preferred"])

        elif injury.severity == Severity.MODERATE:
            decision.contraindicated_patterns.update({"horizontal_pull"})
            decision.restricted_patterns.update({"vertical_pull"})
            decision.load_modifier = min(decision.load_modifier, 0.60)
            decision.rom_modifier = _more_restrictive_rom(
                decision.rom_modifier, ROMModifier.PARTIAL
            )
            decision.coaching_notes.append(
                "[Upper Back – Moderate] No rowing movements of any kind.  "
                "Lat pulldown permissible only if the thoracic spine remains unloaded and "
                "pain-free throughout.  Avoid any exercise compressing the thoracic spine.  "
                "Focus programme on lower body, core, and horizontal pressing."
            )
            decision.substitutions.update(
                {
                    "horizontal_pull": "core_flexion",
                    "vertical_pull": "vertical_pull (light lat pulldown, pain-free only)",
                }
            )
            decision.tags.extend(["no_rows", "thoracic_deloaded"])

        else:  # SEVERE
            decision.contraindicated_patterns.update(
                {"horizontal_pull", "vertical_pull"}
            )
            decision.requires_clearance = True
            decision.clearance_reasons.append(
                "Severe upper back injury — all pulling movements are contraindicated until "
                "the treating clinician confirms structural integrity and clears exercise."
            )
            decision.load_modifier = min(decision.load_modifier, 0.50)
            decision.rom_modifier = _more_restrictive_rom(
                decision.rom_modifier, ROMModifier.NONE_UNTIL_CLEARED
            )
            decision.coaching_notes.append(
                "[Upper Back – Severe] No pulling movements.  Lower body, core, and "
                "pain-free horizontal pressing are the only permitted training domains.  "
                "Medical clearance required before returning to any rowing or pulling work."
            )
            decision.tags.extend(["clearance_required", "no_pulling_movements"])

    # ──────────────────────────────────────────────────────────────────────────
    #  REGION DISPATCH TABLE
    # ──────────────────────────────────────────────────────────────────────────

    # Populated at the end of class body after all methods are defined.
    _REGION_DISPATCH: Dict[
        InjuryRegion,
        Callable[["InjuryRulesEngine", InjuryInput, InjuryDecision], None],
    ] = {}

    # ──────────────────────────────────────────────────────────────────────────
    #  PUBLIC API
    # ──────────────────────────────────────────────────────────────────────────

    def evaluate(self, injuries: List[InjuryInput]) -> InjuryDecision:
        """
        Evaluate a list of ``InjuryInput`` objects and return a single merged
        ``InjuryDecision``.

        Algorithm
        ---------
        1. Initialise a blank decision (all patterns allowed, load_modifier=1.0,
           rom_modifier=FULL).
        2. For each injury:
           a. Run red-flag detection — any flag sets ``requires_clearance=True``.
           b. Dispatch to the region-specific rule method.
        3. Merge by most-restrictive-wins:
           - ``contraindicated_patterns`` : union of all injuries.
           - ``restricted_patterns``      : union minus contraindicated.
           - ``load_modifier``            : minimum across all injuries.
           - ``rom_modifier``             : most restrictive across all injuries.
           - ``requires_clearance``       : logical OR across all injuries.
        4. Compute ``allowed_patterns = ALL_PATTERNS - contraindicated - restricted``.
        5. Deduplicate tags and return the final decision.

        Parameters
        ----------
        injuries : List[InjuryInput]
            One or more structured injury reports for the same user.

        Returns
        -------
        InjuryDecision
            The merged, most-conservative restriction decision.
        """
        decision = InjuryDecision(
            allowed_patterns=set(ALL_PATTERNS),
            load_modifier=1.0,
            rom_modifier=ROMModifier.FULL,
        )

        for injury in injuries:
            # Step 1: Red-flag screen — always runs unconditionally.
            flags = self._check_red_flags(injury)
            if flags:
                decision.red_flags.extend(flags)
                decision.requires_clearance = True
                decision.clearance_reasons.append(
                    f"Red flag(s) detected for {injury.injury_region.value.replace('_', ' ').title()}: "
                    + "; ".join(flags)
                )

            # Step 2: Region-specific rules.
            rule_fn = self._REGION_DISPATCH.get(injury.injury_region)
            if rule_fn is not None:
                rule_fn(self, injury, decision)

        # Step 3: Restricted patterns must not overlap contraindicated.
        decision.restricted_patterns -= decision.contraindicated_patterns

        # Step 4: Compute allowed patterns.
        decision.allowed_patterns = (
            ALL_PATTERNS
            - decision.contraindicated_patterns
            - decision.restricted_patterns
        )

        # Step 5: Deduplicate tags while preserving insertion order.
        decision.tags = list(dict.fromkeys(decision.tags))

        return decision

    def filter_exercises(
        self,
        exercises: List[dict],
        decision: InjuryDecision,
    ) -> List[dict]:
        """
        Filter a raw exercise pool against an ``InjuryDecision``.

        Each exercise dict is expected to contain **at minimum**:

        .. code-block:: text

            {
              "name":             str   — display name of the exercise
              "movement_pattern": str   — one of ALL_PATTERNS
              "sets":             int   — prescribed set count
              "reps_min":         int   — lower bound of rep range
              "reps_max":         int   — upper bound of rep range
            }

        Behaviour
        ---------
        - **Contraindicated** exercises are **removed entirely** (not passed to
          the model).
        - **Restricted** exercises are **kept** but annotated with:
          - ``"load_modifier"``          — the decimal multiplier for load.
          - ``"rom_modifier"``           — the ROM constraint string.
          - ``"injury_note"``            — a concise plain-English annotation.
          - ``"reps_min"`` / ``"reps_max"`` — scaled down by ``load_modifier``
            (floor-clamped at 1).
          - ``"substitution_suggestion"`` — if a substitute pattern is known.
        - **Allowed** exercises pass through unchanged.

        The original dicts are never mutated (shallow copies are made).

        Parameters
        ----------
        exercises : List[dict]
            The full candidate exercise pool.
        decision  : InjuryDecision
            Output from ``evaluate()``.

        Returns
        -------
        List[dict]
            The filtered (and annotated) exercise pool.
        """
        filtered: List[dict] = []

        for exercise in exercises:
            pattern: str = exercise.get("movement_pattern", "")
            ex = dict(exercise)  # shallow copy — never mutate the original

            if pattern in decision.contraindicated_patterns:
                # Hard exclusion — do not include in the pool passed to the model.
                continue

            if pattern in decision.restricted_patterns:
                # Soft restriction — include with annotations.
                ex["load_modifier"] = round(decision.load_modifier, 2)
                ex["rom_modifier"] = decision.rom_modifier.value
                ex["injury_note"] = (
                    f"RESTRICTED ({pattern}): use "
                    f"{int(decision.load_modifier * 100)} % of normal load; "
                    f"ROM constraint: {decision.rom_modifier.value.replace('_', ' ')}."
                )
                # Scale rep range conservatively.
                if "reps_min" in ex:
                    ex["reps_min"] = max(
                        1, int(ex["reps_min"] * decision.load_modifier)
                    )
                if "reps_max" in ex:
                    ex["reps_max"] = max(
                        1, int(ex["reps_max"] * decision.load_modifier)
                    )
                # Attach substitution guidance when available.
                sub = decision.substitutions.get(pattern)
                if sub:
                    ex["substitution_suggestion"] = sub

            # Both restricted and allowed exercises are appended.
            filtered.append(ex)

        return filtered

    def explain(self, decision: InjuryDecision) -> str:
        """
        Produce a human-readable, structured plain-text explanation of all
        injury-based restrictions contained in an ``InjuryDecision``.

        Intended use
        ------------
        - Surface directly to the end-user in the app UI ("Why is bench press
          not in my plan?").
        - Log to the server-side audit trail for clinical review.
        - Embed in API responses alongside the workout plan.

        Parameters
        ----------
        decision : InjuryDecision
            Output from ``evaluate()``.

        Returns
        -------
        str
            A formatted multi-line report string.
        """
        lines: List[str] = [
            "╔══════════════════════════════════════════════════════════════════╗",
            "║            INJURY RESTRICTION REPORT  (IntelliFit AI)           ║",
            "╚══════════════════════════════════════════════════════════════════╝",
            "",
        ]

        # ── Red flags ─────────────────────────────────────────────────────────
        if decision.red_flags:
            lines.append("⚠  RED FLAGS DETECTED")
            lines.append("   " + "─" * 60)
            for flag in decision.red_flags:
                lines.append(f"   • {flag}")
            lines.append("")

        # ── Clearance requirement ─────────────────────────────────────────────
        if decision.requires_clearance:
            lines.append("🚫  MEDICAL / PHYSIOTHERAPY CLEARANCE REQUIRED")
            lines.append("   " + "─" * 60)
            for reason in decision.clearance_reasons:
                # Wrap long reasons for readability.
                lines.append(f"   • {reason}")
            lines.append("")

        # ── Contraindicated patterns ──────────────────────────────────────────
        if decision.contraindicated_patterns:
            lines.append("❌  CONTRAINDICATED MOVEMENT PATTERNS")
            lines.append("   (these exercises are excluded from your programme)")
            lines.append("   " + "─" * 60)
            for p in sorted(decision.contraindicated_patterns):
                lines.append(f"   ✗  {p}")
            lines.append("")

        # ── Restricted patterns ───────────────────────────────────────────────
        if decision.restricted_patterns:
            lines.append(
                f"⚡  RESTRICTED PATTERNS  "
                f"(load modifier: {int(decision.load_modifier * 100)} %  |  "
                f"ROM: {decision.rom_modifier.value.replace('_', ' ').title()})"
            )
            lines.append("   (included with modified load and ROM constraints)")
            lines.append("   " + "─" * 60)
            for p in sorted(decision.restricted_patterns):
                sub = decision.substitutions.get(p)
                sub_str = f"  →  substitute: {sub}" if sub else ""
                lines.append(f"   ~  {p}{sub_str}")
            lines.append("")

        # ── Load / ROM summary ────────────────────────────────────────────────
        lines.append("📊  LOAD & ROM SUMMARY")
        lines.append("   " + "─" * 60)
        lines.append(
            f"   Load modifier  : {int(decision.load_modifier * 100)} % of normal prescribed load"
        )
        lines.append(
            f"   ROM modifier   : {decision.rom_modifier.value.replace('_', ' ').title()}"
        )
        lines.append("")

        # ── Substitutions ─────────────────────────────────────────────────────
        if decision.substitutions:
            lines.append("🔀  PATTERN SUBSTITUTIONS")
            lines.append("   " + "─" * 60)
            for avoided, substitute in decision.substitutions.items():
                lines.append(f"   {avoided:<25s}  →  {substitute}")
            lines.append("")

        # ── Coaching notes ────────────────────────────────────────────────────
        if decision.coaching_notes:
            lines.append("📝  COACHING NOTES")
            lines.append("   " + "─" * 60)
            for note in decision.coaching_notes:
                lines.append(f"   • {note}")
            lines.append("")

        # ── Allowed patterns ──────────────────────────────────────────────────
        if decision.allowed_patterns:
            lines.append("✅  UNRESTRICTED MOVEMENT PATTERNS")
            lines.append("   " + "─" * 60)
            for p in sorted(decision.allowed_patterns):
                lines.append(f"   ✓  {p}")
            lines.append("")

        # ── Tags ──────────────────────────────────────────────────────────────
        if decision.tags:
            lines.append(f"🏷   TAGS:  {',  '.join(decision.tags)}")
            lines.append("")

        return "\n".join(lines)

    @classmethod
    def from_dict(cls, data: dict) -> InjuryInput:
        """
        Parse a raw API request dictionary into a typed ``InjuryInput``.

        Designed to be robust against the messy inputs that come from a mobile
        front-end (string booleans, string integers, missing keys, unknown enum
        strings, etc.).

        Safe defaults (conservative)
        ----------------------------
        - Unknown injury region  → SHOULDER (most commonly reported; warns broadly)
        - Unknown injury type    → UNKNOWN
        - Unknown severity       → MODERATE  (conservative)
        - Unknown duration       → SUBACUTE  (conservative)
        - Unknown pain level     → 5 / 10
        - Unknown bool fields    → False (except: all False is the safe baseline)

        Parameters
        ----------
        data : dict
            Raw key-value dictionary from an API request body.

        Returns
        -------
        InjuryInput
            A fully-typed and validated injury input object.

        Examples
        --------
        >>> engine = InjuryRulesEngine()
        >>> inj = InjuryRulesEngine.from_dict({
        ...     "injury_region": "knee",
        ...     "injury_type": "sprain",
        ...     "severity": "moderate",
        ...     "duration_category": "subacute",
        ...     "pain_now": "6",
        ...     "doctor_cleared": "false",
        ... })
        """

        def _safe_enum(enum_cls, value, default):
            """Coerce ``value`` to ``enum_cls``; fall back to ``default``."""
            if value is None:
                return default
            try:
                return enum_cls(str(value).strip().lower())
            except (ValueError, KeyError, AttributeError):
                return default

        def _safe_int(value, default: int, lo: int = 0, hi: int = 10) -> int:
            """Coerce ``value`` to int clamped in [lo, hi]."""
            try:
                return max(lo, min(hi, int(float(str(value)))))
            except (TypeError, ValueError):
                return default

        def _safe_bool(value, default: bool = False) -> bool:
            """Flexibly coerce ``value`` to bool."""
            if isinstance(value, bool):
                return value
            if isinstance(value, int):
                return bool(value)
            if isinstance(value, str):
                return value.strip().lower() in ("true", "yes", "1", "on")
            return default

        def _safe_list(value, default: Optional[List] = None) -> List:
            """Ensure a list is returned; never None."""
            if default is None:
                default = []
            if isinstance(value, list):
                return [str(v) for v in value]
            if isinstance(value, str) and value.strip():
                # Accept comma-separated string as a fallback.
                return [v.strip() for v in value.split(",") if v.strip()]
            return default

        return InjuryInput(
            injury_region=_safe_enum(
                InjuryRegion, data.get("injury_region"), InjuryRegion.SHOULDER
            ),
            injury_type=_safe_enum(
                InjuryType, data.get("injury_type"), InjuryType.UNKNOWN
            ),
            severity=_safe_enum(Severity, data.get("severity"), Severity.MODERATE),
            duration_category=_safe_enum(
                DurationCategory,
                data.get("duration_category"),
                DurationCategory.SUBACUTE,
            ),
            pain_now=_safe_int(data.get("pain_now", 5), default=5, lo=0, hi=10),
            pain_with_daily_activity=_safe_bool(
                data.get("pain_with_daily_activity"), False
            ),
            range_of_motion_limited=_safe_bool(
                data.get("range_of_motion_limited"), False
            ),
            doctor_cleared=_safe_bool(data.get("doctor_cleared"), False),
            currently_in_physio=_safe_bool(data.get("currently_in_physio"), False),
            movements_that_hurt=_safe_list(data.get("movements_that_hurt"), []),
            recent_trauma=_safe_bool(data.get("recent_trauma"), False),
            unexplained_swelling=_safe_bool(data.get("unexplained_swelling"), False),
            major_weakness=_safe_bool(data.get("major_weakness"), False),
            systemic_symptoms=_safe_bool(data.get("systemic_symptoms"), False),
            worsening=_safe_bool(data.get("worsening"), False),
        )


# Populate the dispatch table after all methods are defined to avoid
# forward-reference issues inside the class body.
InjuryRulesEngine._REGION_DISPATCH = {
    InjuryRegion.SHOULDER: InjuryRulesEngine._shoulder_rules,
    InjuryRegion.KNEE: InjuryRulesEngine._knee_rules,
    InjuryRegion.LOWER_BACK: InjuryRulesEngine._lower_back_rules,
    InjuryRegion.UPPER_BACK: InjuryRulesEngine._upper_back_rules,
    InjuryRegion.ELBOW: InjuryRulesEngine._elbow_rules,
    InjuryRegion.WRIST: InjuryRulesEngine._wrist_rules,
    InjuryRegion.ANKLE: InjuryRulesEngine._ankle_rules,
    InjuryRegion.HIP: InjuryRulesEngine._hip_rules,
    InjuryRegion.NECK: InjuryRulesEngine._neck_rules,
}


# ══════════════════════════════════════════════════════════════════════════════
#  UTILITY FUNCTIONS
# ══════════════════════════════════════════════════════════════════════════════


def decision_to_json(decision: InjuryDecision, indent: int = 2) -> str:
    """
    Serialise an ``InjuryDecision`` to a pretty-printed JSON string.

    Useful for logging, API responses, and debugging.  Sets and
    ``ROMModifier`` enums are coerced to JSON-serialisable types
    (sorted lists and strings respectively).

    Parameters
    ----------
    decision : InjuryDecision
        The decision object to serialise.
    indent : int
        JSON indentation level (default 2).

    Returns
    -------
    str
        A JSON-formatted string representation of the decision.
    """
    payload = {
        "requires_clearance": decision.requires_clearance,
        "clearance_reasons": decision.clearance_reasons,
        "contraindicated_patterns": sorted(decision.contraindicated_patterns),
        "restricted_patterns": sorted(decision.restricted_patterns),
        "allowed_patterns": sorted(decision.allowed_patterns),
        "load_modifier": decision.load_modifier,
        "rom_modifier": decision.rom_modifier.value,
        "coaching_notes": decision.coaching_notes,
        "red_flags": decision.red_flags,
        "substitutions": decision.substitutions,
        "tags": decision.tags,
    }
    return json.dumps(payload, indent=indent, ensure_ascii=False)


def build_injury_context_for_training(injuries: List[InjuryInput]) -> str:
    """
    Serialise a list of ``InjuryInput`` objects into the compact pipe-delimited
    context string used when constructing training-data prompts for the workout
    generator model.

    Format
    ------
    ::

        <region>(<severity>,<pain>/10,<type>)[|<region>(...)]

    Examples
    --------
    ::

        # Single injury
        "shoulder(moderate,5/10,impingement)"

        # Multiple concurrent injuries
        "shoulder(moderate,5/10,impingement)|knee(mild,3/10,pain)"

        # No injuries reported
        "no_injuries"

    Parameters
    ----------
    injuries : List[InjuryInput]
        The user's reported injuries (empty list → "no_injuries").

    Returns
    -------
    str
        A compact, model-readable context tag string.
    """
    if not injuries:
        return "no_injuries"

    parts = [
        (
            f"{inj.injury_region.value}"
            f"({inj.severity.value},{inj.pain_now}/10,{inj.injury_type.value})"
        )
        for inj in injuries
    ]
    return "|".join(parts)


# ══════════════════════════════════════════════════════════════════════════════
#  DEMO
# ══════════════════════════════════════════════════════════════════════════════


def demo() -> None:
    """
    Run three illustrative scenarios that exercise the engine end-to-end.

    1. Mild shoulder impingement  → decision + explanation
    2. Moderate knee strain       → exercise pool filtering
    3. Severe lower back (post-op) + red flags → clearance required
    4. ``from_dict()`` with messy / partial API input
    """
    # Ensure UTF-8 output on Windows terminals (cp1252 cannot render box-drawing
    # characters and emoji used in explain() and the demo separators).
    if isinstance(sys.stdout, io.TextIOWrapper):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    engine = InjuryRulesEngine()
    _SEP = "\n" + "═" * 72 + "\n"

    # ─────────────────────────────────────────────────────────────────────────
    # DEMO 1 — Mild shoulder impingement (4/10 pain, currently in physio)
    # ─────────────────────────────────────────────────────────────────────────
    print(_SEP)
    print("  DEMO 1 — Mild Shoulder Impingement  (4/10 pain, in physio)")
    print(_SEP)

    shoulder_mild = InjuryInput(
        injury_region=InjuryRegion.SHOULDER,
        injury_type=InjuryType.IMPINGEMENT,
        severity=Severity.MILD,
        duration_category=DurationCategory.SUBACUTE,
        pain_now=4,
        pain_with_daily_activity=True,
        range_of_motion_limited=True,
        doctor_cleared=False,
        currently_in_physio=True,
        movements_that_hurt=["overhead_press", "upright_row"],
        recent_trauma=False,
        unexplained_swelling=False,
        major_weakness=False,
        systemic_symptoms=False,
        worsening=False,
    )

    decision1 = engine.evaluate([shoulder_mild])
    print(engine.explain(decision1))
    print(
        f"Training context tag:  {build_injury_context_for_training([shoulder_mild])}\n"
    )

    # ─────────────────────────────────────────────────────────────────────────
    # DEMO 2 — Moderate knee strain → exercise pool filtering
    # ─────────────────────────────────────────────────────────────────────────
    print(_SEP)
    print("  DEMO 2 — Moderate Knee Strain  (6/10 pain) — Exercise Pool Filtering")
    print(_SEP)

    knee_moderate = InjuryInput(
        injury_region=InjuryRegion.KNEE,
        injury_type=InjuryType.STRAIN,
        severity=Severity.MODERATE,
        duration_category=DurationCategory.SUBACUTE,
        pain_now=6,
        pain_with_daily_activity=True,
        range_of_motion_limited=True,
        doctor_cleared=False,
        currently_in_physio=False,
        movements_that_hurt=["squat", "stair_climbing", "kneeling"],
        recent_trauma=False,
        unexplained_swelling=False,
        major_weakness=False,
        systemic_symptoms=False,
        worsening=False,
    )

    decision2 = engine.evaluate([knee_moderate])
    print(engine.explain(decision2))

    exercise_pool = [
        {
            "name": "Barbell Back Squat",
            "movement_pattern": "squat",
            "sets": 4,
            "reps_min": 6,
            "reps_max": 10,
        },
        {
            "name": "Romanian Deadlift",
            "movement_pattern": "hip_hinge",
            "sets": 3,
            "reps_min": 8,
            "reps_max": 12,
        },
        {
            "name": "Walking Lunge",
            "movement_pattern": "lunge",
            "sets": 3,
            "reps_min": 10,
            "reps_max": 15,
        },
        {
            "name": "Leg Extension",
            "movement_pattern": "knee_extension",
            "sets": 3,
            "reps_min": 12,
            "reps_max": 15,
        },
        {
            "name": "Seated Leg Curl",
            "movement_pattern": "knee_flexion",
            "sets": 3,
            "reps_min": 12,
            "reps_max": 15,
        },
        {
            "name": "Flat Bench Press",
            "movement_pattern": "horizontal_push",
            "sets": 4,
            "reps_min": 6,
            "reps_max": 10,
        },
        {
            "name": "Cable Row",
            "movement_pattern": "horizontal_pull",
            "sets": 3,
            "reps_min": 10,
            "reps_max": 12,
        },
        {
            "name": "Lat Pulldown",
            "movement_pattern": "vertical_pull",
            "sets": 3,
            "reps_min": 8,
            "reps_max": 12,
        },
        {
            "name": "Overhead Press",
            "movement_pattern": "vertical_push",
            "sets": 3,
            "reps_min": 8,
            "reps_max": 10,
        },
        {
            "name": "Ab Wheel Rollout",
            "movement_pattern": "core_flexion",
            "sets": 3,
            "reps_min": 8,
            "reps_max": 12,
        },
        {
            "name": "Standing Calf Raise",
            "movement_pattern": "calf",
            "sets": 4,
            "reps_min": 15,
            "reps_max": 20,
        },
    ]

    filtered = engine.filter_exercises(exercise_pool, decision2)

    print("─" * 72)
    print(f"{'Exercise':<28} {'Pattern':<22} {'Result'}")
    print("─" * 72)
    for ex in filtered:
        note = ex.get("injury_note", "✅  Unrestricted")
        reps = f"{ex.get('reps_min', '?')}–{ex.get('reps_max', '?')} reps"
        print(
            f"  {ex['name']:<26} {ex['movement_pattern']:<22} {reps:<14}  {note[:55]}"
        )

    excluded_names = [
        e["name"]
        for e in exercise_pool
        if e["movement_pattern"] in decision2.contraindicated_patterns
    ]
    print(f"\n  Excluded entirely: {', '.join(excluded_names)}")
    print(
        f"\nTraining context tag:  {build_injury_context_for_training([knee_moderate])}\n"
    )

    # ─────────────────────────────────────────────────────────────────────────
    # DEMO 3 — Severe lower back (post-op) with multiple red flags
    # ─────────────────────────────────────────────────────────────────────────
    print(_SEP)
    print("  DEMO 3 — Severe Lower Back (POST-OP)  +  Red Flags  →  Clearance Required")
    print(_SEP)

    lower_back_severe = InjuryInput(
        injury_region=InjuryRegion.LOWER_BACK,
        injury_type=InjuryType.POST_OP,
        severity=Severity.SEVERE,
        duration_category=DurationCategory.SUBACUTE,
        pain_now=9,
        pain_with_daily_activity=True,
        range_of_motion_limited=True,
        doctor_cleared=False,
        currently_in_physio=True,
        movements_that_hurt=["bending", "lifting", "twisting", "prolonged_sitting"],
        recent_trauma=False,
        unexplained_swelling=True,
        major_weakness=True,
        systemic_symptoms=False,
        worsening=False,
    )

    decision3 = engine.evaluate([lower_back_severe])
    print(engine.explain(decision3))
    print(
        f"Training context tag:  {build_injury_context_for_training([lower_back_severe])}\n"
    )

    # ─────────────────────────────────────────────────────────────────────────
    # DEMO 4 — from_dict() with messy / partial API input (wrist tendinitis)
    # ─────────────────────────────────────────────────────────────────────────
    print(_SEP)
    print(
        "  DEMO 4 — from_dict()  with Partial / Messy API Payload  (Wrist Tendinitis)"
    )
    print(_SEP)

    raw_api_payload: dict = {
        "injury_region": "wrist",
        "injury_type": "tendinitis",
        "severity": "moderate",
        "duration_category": "chronic",
        "pain_now": "7",  # string — should be coerced to int
        "pain_with_daily_activity": "true",  # string bool
        "range_of_motion_limited": 1,  # int bool
        "doctor_cleared": False,
        "currently_in_physio": False,
        "movements_that_hurt": ["push_up", "curl", "typing"],
        "recent_trauma": False,
        "unexplained_swelling": False,
        "major_weakness": False,
        "systemic_symptoms": False,
        "worsening": False,
        # deliberately missing: nothing else — the rest get safe defaults
    }

    parsed_injury = InjuryRulesEngine.from_dict(raw_api_payload)
    print("  Parsed InjuryInput:")
    print(f"    region          : {parsed_injury.injury_region.value}")
    print(f"    type            : {parsed_injury.injury_type.value}")
    print(f"    severity        : {parsed_injury.severity.value}")
    print(f"    duration        : {parsed_injury.duration_category.value}")
    print(f"    pain now        : {parsed_injury.pain_now}/10")
    print(f"    ROM limited     : {parsed_injury.range_of_motion_limited}")
    print(f"    movements hurt  : {parsed_injury.movements_that_hurt}")
    print()

    decision4 = engine.evaluate([parsed_injury])
    print(engine.explain(decision4))
    print(
        f"Training context tag:  {build_injury_context_for_training([parsed_injury])}\n"
    )

    # ─────────────────────────────────────────────────────────────────────────
    # DEMO 5 — Multiple concurrent injuries (shoulder + lower back)
    # ─────────────────────────────────────────────────────────────────────────
    print(_SEP)
    print(
        "  DEMO 5 — Multiple Concurrent Injuries  (Shoulder Moderate + Lower Back Mild)"
    )
    print(_SEP)

    shoulder_moderate = InjuryInput(
        injury_region=InjuryRegion.SHOULDER,
        injury_type=InjuryType.STRAIN,
        severity=Severity.MODERATE,
        duration_category=DurationCategory.CHRONIC,
        pain_now=5,
        pain_with_daily_activity=True,
        range_of_motion_limited=True,
        doctor_cleared=False,
        currently_in_physio=False,
        movements_that_hurt=["overhead_press", "behind_neck_pull"],
        recent_trauma=False,
        unexplained_swelling=False,
        major_weakness=False,
        systemic_symptoms=False,
        worsening=False,
    )

    lower_back_mild = InjuryInput(
        injury_region=InjuryRegion.LOWER_BACK,
        injury_type=InjuryType.STRAIN,
        severity=Severity.MILD,
        duration_category=DurationCategory.CHRONIC,
        pain_now=3,
        pain_with_daily_activity=False,
        range_of_motion_limited=False,
        doctor_cleared=True,
        currently_in_physio=True,
        movements_that_hurt=["deadlift", "good_morning"],
        recent_trauma=False,
        unexplained_swelling=False,
        major_weakness=False,
        systemic_symptoms=False,
        worsening=False,
    )

    decision5 = engine.evaluate([shoulder_moderate, lower_back_mild])
    print(engine.explain(decision5))
    print(
        f"Training context tag:  "
        f"{build_injury_context_for_training([shoulder_moderate, lower_back_mild])}\n"
    )


# ══════════════════════════════════════════════════════════════════════════════
#  ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    demo()
