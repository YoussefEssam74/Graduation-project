"""Training stub for nutrition plan model."""
import argparse


def train(data_path: str, out_dir: str, epochs: int = 1):
    print(f"Training nutrition stub: data={data_path}, out={out_dir}, epochs={epochs}")
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
