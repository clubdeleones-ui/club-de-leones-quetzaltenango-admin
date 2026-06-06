import subprocess

result = subprocess.run(['git', 'diff', 'views/Dashboard.tsx'], capture_output=True, text=True)
with open('scratch/dashboard_diff.txt', 'w') as f:
    f.write(result.stdout)

print("Diff saved to scratch/dashboard_diff.txt")
