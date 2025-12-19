"""Training pipeline stub for workout plan model.
Example usage:
    python scripts/train_workout.py --data data/cleaned.csv --out models/workout
"""
import argparse


def train(data_path: str, out_dir: str, epochs: int = 1):
    # stub: load data, train or export templates
    print(f"Training stub: data={data_path}, out={out_dir}, epochs={epochs}")
    # return a path to model artifact or None
    return None


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--data', required=True)
    p.add_argument('--out', required=True)
    p.add_argument('--epochs', type=int, default=1)
    args = p.parse_args()
    train(args.data, args.out, epochs=args.epochs)


if __name__ == '__main__':
    main()
