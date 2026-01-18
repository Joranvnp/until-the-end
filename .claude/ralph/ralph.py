import os
import sys
import json
import subprocess
import time
import argparse

def main():
    parser = argparse.ArgumentParser(description='Ralph - Autonomous AI Coding Loop')
    parser.add_argument('-f', '--feature', required=True, help='Feature folder name')
    parser.add_argument('-n', '--max', type=int, default=10, help='Max iterations')
    args = parser.parse_args()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    feature_folder = args.feature
    task_dir = os.path.join(script_dir, 'tasks', feature_folder)

    if not os.path.isdir(task_dir):
        print(f"❌ Error: Feature folder not found: {task_dir}")
        sys.exit(1)

    prd_file = os.path.join(task_dir, 'prd.json')
    progress_file = os.path.join(task_dir, 'progress.txt')
    
    # Check if prompt.md is in the same directory as this script
    prompt_file = os.path.join(script_dir, 'prompt.md')

    if not os.path.isfile(prd_file):
        print(f"❌ Error: prd.json not found in {task_dir}")
        sys.exit(1)

    with open(prd_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        total_stories = len(data.get('userStories', []))
        completed = sum(1 for s in data.get('userStories', []) if s.get('passes') == True)

    print("╔════════════════════════════════════════════════════════════╗")
    print("║                    🤖 RALPH STARTING                       ║")
    print("╠════════════════════════════════════════════════════════════╣")
    print(f"║ Feature: {feature_folder}")
    print(f"║ Stories: {completed} / {total_stories} completed")
    print(f"║ Max iterations: {args.max}")
    print("╚════════════════════════════════════════════════════════════╝")
    print("")

    for i in range(1, args.max + 1):
        # Refresh counts
        try:
            with open(prd_file, 'r', encoding='utf-8') as f:
                 data = json.load(f)
                 completed = sum(1 for s in data.get('userStories', []) if s.get('passes') == True)
                 remaining = total_stories - completed
        except Exception as e:
            print(f"Error reading PRD: {e}")
            remaining = "???"

        print("")
        print("═══════════════════════════════════════════════════════════════")
        print(f"📍 Iteration {i} / {args.max} | Completed: {completed} / {total_stories} | Remaining: {remaining}")
        print("═══════════════════════════════════════════════════════════════")
        print("")

        # Construct command
        # claude -p --dangerously-skip-permissions "@prd.json @progress.txt @prompt.md"
        # We need to pass absolute paths or ensure CWD is correct.
        # The original script passed arguments to claude.
        
        # Construct command
        # Check for claude executable
        import shutil
        claude_exe = shutil.which("claude")
        if not claude_exe:
            claude_exe = shutil.which("claude.cmd")
        if not claude_exe:
            # Fallback to common npm locations or user provided path
            candidate = r"C:\Users\Utilisateur\AppData\Roaming\npm\claude.cmd"
            if os.path.isfile(candidate):
                claude_exe = candidate
        
        if not claude_exe:
            print("❌ Error: 'claude' executable not found in PATH or standard locations.")
            print("Please ensure you can run 'claude' from the command line.")
            sys.exit(1)

        # Read prompt content (Instructions)
        try:
            with open(prompt_file, 'r', encoding='utf-8') as pf:
                instructions = pf.read()
        except Exception as e:
            print(f"❌ Error reading prompt file: {e}")
            sys.exit(1)

        # Read PRD
        try:
            with open(prd_file, 'r', encoding='utf-8') as f:
                prd_content = f.read()
        except Exception as e:
            prd_content = "Error reading PRD"
        
        # Read Progress
        try:
            with open(progress_file, 'r', encoding='utf-8') as f:
                progress_content = f.read()
        except Exception as e:
            progress_content = "No progress yet."

        # Combine into one massive prompt
        full_prompt = f"""
START CONTEXT
PRD FILE (prd.json):
{prd_content}

PROGRESS LOG (progress.txt):
{progress_content}
END CONTEXT

COMMAND:
{instructions}
"""
        
        # Write to a temporary prompt file to avoid command line length issues
        temp_prompt_file = os.path.join(task_dir, 'current_iteration_prompt.txt')
        with open(temp_prompt_file, 'w', encoding='utf-8') as f:
            f.write(full_prompt)

        cmd = [
            claude_exe, 
            "-p", 
            "--dangerously-skip-permissions", 
            f"@{temp_prompt_file}"
        ]

        try:
            print(f"Executing: {' '.join(cmd)}")
            process = subprocess.Popen(
                cmd, 
                stdout=subprocess.PIPE, 
                stderr=subprocess.STDOUT,
                text=True,
                encoding='utf-8',
                errors='replace'
            )
            
            output_lines = []
            while True:
                line = process.stdout.readline()
                if not line:
                    break
                print(line, end='')
                output_lines.append(line)
            
            process.wait()
            output = "".join(output_lines)
            
            if "<promise>COMPLETE</promise>" in output:
                print("")
                print("╔════════════════════════════════════════════════════════════╗")
                print("║                    ✅ RALPH COMPLETE                       ║")
                print("╠════════════════════════════════════════════════════════════╣")
                print(f"║ All {total_stories} stories completed in {i} iterations!")
                print("╚════════════════════════════════════════════════════════════╝")
                sys.exit(0)

        except Exception as e:
            print(f"❌ Error executing claude: {e}")

        time.sleep(2)

    print("")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║                    ⚠️  MAX ITERATIONS                       ║")
    print("╠════════════════════════════════════════════════════════════╣")
    print(f"║ Reached {args.max} iterations. Run again to continue.")
    print("╚════════════════════════════════════════════════════════════╝")
    sys.exit(1)

if __name__ == "__main__":
    main()
