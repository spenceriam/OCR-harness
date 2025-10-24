#!/usr/bin/env python3
"""Startup script for vLLM server with LightOnOCR model."""
import subprocess
import sys
import yaml
from pathlib import Path


def load_model_config():
    """Load model configuration from YAML file."""
    config_path = Path(__file__).parent / "config" / "models.yaml"

    if not config_path.exists():
        print(f"Error: Model config not found at {config_path}")
        sys.exit(1)

    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)

    return config


def start_vllm_server():
    """Start vLLM server with configured model."""
    config = load_model_config()

    # Get default model configuration
    default_model_id = config['models']['default']
    model_config = config['models']['configurations'][default_model_id]

    model_path = model_config['model_path']
    port = model_config.get('server_port', 8001)

    print(f"Starting vLLM server with model: {model_config['display_name']}")
    print(f"Model path: {model_path}")
    print(f"Port: {port}")
    print("\nThis may take several minutes to download and load the model...")
    print("=" * 60)

    # Build vLLM command
    cmd = [
        "vllm", "serve",
        model_path,
        "--limit-mm-per-prompt", '{"image": 1}',
        "--port", str(port),
        "--host", "0.0.0.0"
    ]

    try:
        # Run vLLM server
        subprocess.run(cmd, check=True)

    except subprocess.CalledProcessError as e:
        print(f"\nError: vLLM server failed to start: {e}")
        print("\nTroubleshooting:")
        print("1. Ensure vLLM is installed: pip install vllm")
        print("2. Check if you have enough RAM (8GB minimum, 16GB recommended)")
        print("3. For GPU support, ensure CUDA is properly configured")
        sys.exit(1)

    except KeyboardInterrupt:
        print("\nvLLM server stopped by user")
        sys.exit(0)

    except Exception as e:
        print(f"\nUnexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    start_vllm_server()
