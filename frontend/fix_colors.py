import os
import re
from pathlib import Path

def replace_colors(directory):
    replacements = [
        (r'bg-\[#111111\]', 'bg-card'),
        (r'bg-\[#0d0d0d\]', 'bg-surface-soft'),
        (r'bg-\[#161616\]', 'bg-surface-elevated'),
        (r'bg-\[#1a1a1a\]', 'bg-surface-elevated'),
        (r'text-\[#737373\]', 'text-muted-foreground'),
        (r'text-\[#404040\]', 'text-ink-faint'),
        (r'text-\[#f5f5f5\]', 'text-foreground'),
        (r'text-\[#c8c8c8\]', 'text-secondary-foreground'),
        (r'text-\[#a3a3a3\]', 'text-secondary-foreground'),
        (r'border-white/\[0\.08\]', 'border-border/50'),
        (r'border-white/10', 'border-border'),
        (r'border-white/5', 'border-border/50'),
        (r'bg-white/\[0\.02\]', 'bg-white/5'),
        (r'bg-\[#000000\]', 'bg-background'),
    ]

    for root, dirs, files in os.walk(directory):
        for name in files:
            if name.endswith('.tsx') or name.endswith('.ts'):
                path = os.path.join(root, name)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()

                new_content = content
                for pattern, replacement in replacements:
                    new_content = re.sub(pattern, replacement, new_content)

                if content != new_content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f'Updated {path}')

replace_colors('src')
