import pandas as pd
import os

CSV_FILE = r'C:\Users\Dipak\Fuel@Door\archive\extracted_pan_data.csv'
OUTPUT_SQL = r'C:\Users\Dipak\Fuel@Door\seed_data.sql'

def generate_sql():
    if not os.path.exists(CSV_FILE):
        print(f"Error: CSV file not found at {CSV_FILE}")
        return

    try:
        df = pd.read_csv(CSV_FILE)
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return

    print(f"Found {len(df)} records.")

    with open(OUTPUT_SQL, 'w') as f:
        f.write("-- Seed data for pan_users table\n")
        f.write("INSERT INTO public.pan_users (pan_number, full_name) VALUES\n")
        
        values = []
        for index, row in df.iterrows():
            pan = row['PAN_NUMBER']
            name = row['FULL_NAME'].replace("'", "''") # Escape single quotes
            values.append(f"('{pan}', '{name}')")
        
        f.write(",\n".join(values))
        f.write("\nON CONFLICT (pan_number) DO NOTHING;\n")

    print(f"SQL file generated at {OUTPUT_SQL}")

if __name__ == "__main__":
    generate_sql()
