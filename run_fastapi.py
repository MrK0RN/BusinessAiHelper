#!/usr/bin/env python3
import os
import sys
import subprocess

def main():
    # Ensure we have the DATABASE_URL
    if not os.getenv("DATABASE_URL"):
        print("ERROR: DATABASE_URL environment variable is required")
        sys.exit(1)
    
    # Run the FastAPI application
    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "main:app", 
            "--host", "0.0.0.0", 
            "--port", "8000",
            "--reload"
        ], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Error starting FastAPI: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()