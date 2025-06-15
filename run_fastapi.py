#!/usr/bin/env python3
import uvicorn
import os

def main():
    # Get port from environment or default to 8000
    port = int(os.getenv("PORT", "8000"))
    
    # Run FastAPI server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    main()