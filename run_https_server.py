#!/usr/bin/env python3
"""
Simple HTTPS server for local development
Generates self-signed certificate automatically
"""

import http.server
import ssl
import os
import subprocess
import sys

PORT = 8443

def generate_certificate():
    """Generate self-signed certificate if it doesn't exist"""
    if not os.path.exists('server.pem'):
        print("Generating self-signed certificate...")
        try:
            # Generate self-signed certificate using openssl
            subprocess.run([
                'openssl', 'req', '-new', '-x509', '-keyout', 'server.pem', 
                '-out', 'server.pem', '-days', '365', '-nodes',
                '-subj', '/CN=localhost'
            ], check=True)
            print("Certificate generated: server.pem")
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("ERROR: OpenSSL not found. Using alternative method...")
            # Fallback: just inform user
            print("\nPlease install OpenSSL or use http-server with --ssl flag")
            print("For now, please use one of these options:")
            print("1. Allow insecure content in Chrome")
            print("2. Install 'http-server' via npm: npm install -g http-server")
            print("   Then run: http-server -S -C cert.pem -K key.pem")
            sys.exit(1)

def run_server():
    """Run HTTPS server"""
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    generate_certificate()
    
    server_address = ('', PORT)
    httpd = http.server.HTTPServer(server_address, http.server.SimpleHTTPRequestHandler)
    
    # Wrap socket with SSL
    httpd.socket = ssl.wrap_socket(
        httpd.socket,
        server_side=True,
        certfile='server.pem',
        ssl_version=ssl.PROTOCOL_TLS
    )
    
    print(f"\n✅ HTTPS Server running at:")
    print(f"   https://localhost:{PORT}/")
    print(f"\n⚠️  You'll see a security warning - click 'Advanced' and 'Proceed to localhost'")
    print(f"\nPress Ctrl+C to stop the server\n")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServer stopped.")

if __name__ == '__main__':
    run_server()

