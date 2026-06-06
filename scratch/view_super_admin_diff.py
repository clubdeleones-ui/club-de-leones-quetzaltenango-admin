import subprocess

result = subprocess.run(['git', 'diff', 'views/SuperAdmin.tsx'], capture_output=True, text=True)
with open('scratch/super_admin_diff.txt', 'w') as f:
    f.write(result.stdout)

print("Diff saved to scratch/super_admin_diff.txt")
