import pandas as pd
import requests
import json
import os

# Configuration from config.js (hardcoded for backend script use)
SUPABASE_URL = 'https://qfqfmkktvyojubrsbamb.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcWZta2t0dnlvanVicnNiYW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NTM5OTgsImV4cCI6MjA4NjEyOTk5OH0.YvgM55b1-Ky2yXkFDns3tPKq0cQdRrzzUb3Wt2HqtIA'

# Input CSV
CSV_FILE = r'C:\Users\Dipak\Fuel@Door\archive\extracted_pan_data.csv'

def seed_users():
    if not os.path.exists(CSV_FILE):
        print(f"Error: CSV file not found at {CSV_FILE}")
        return

    # Read CSV
    try:
        df = pd.read_csv(CSV_FILE)
        # Ensure column names match what we expect
        # Valid CSV header from pan extractor: PAN_NUMBER,FULL_NAME,Image
        if 'PAN_NUMBER' not in df.columns or 'FULL_NAME' not in df.columns:
            print("Error: CSV must contain 'PAN_NUMBER' and 'FULL_NAME' columns.")
            return
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return

    print(f"Found {len(df)} records in CSV.")

    # Prepare data for insertion
    records = []
    for _, row in df.iterrows():
        records.append({
            "pan_number": row['PAN_NUMBER'],
            "full_name": row['FULL_NAME']
        })

    # Upsert data to Supabase
    # We use upsert=true on conflict (pan_number)
    url = f"{SUPABASE_URL}/rest/v1/pan_users"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates" # Upsert behavior
    }

    try:
        response = requests.post(url, headers=headers, json=records)
        
        if response.status_code in [200, 201]:
            print("Successfully seeded PAN users!")
            print(f"Inserted/Updated {len(records)} records.")
        else:
            print(f"Failed to seed data. Status Code: {response.status_code}")
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")

if __name__ == "__main__":
    seed_users()
