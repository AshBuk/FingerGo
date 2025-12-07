<!--
Copyright 2025 Asher Buk
SPDX-License-Identifier: Apache-2.0
-->

## Text Management

#### Category System
- **Hierarchical structure:** All → 
Categories → Texts
- **Visual representation:** Icon-based widgets for each category
  - Generic text icon for plain text categories
  - Language-specific icons for programming languages (Go, TypeScript, Python, etc.)
- **Navigation:** Tree view in sidebar showing full folder/subfolder structure

#### Text Operations
| Action | Description |
|--------|-------------|
| **View texts** | Browse texts organized by categories and subcategories in UI |
| **Add text** | Create new text manually (title + content) |
| **Import text** | Import from file (.txt, code files) |
| **Edit text** | Modify existing text content |
| **Delete text** | Remove text from library |
| **Favorite** | Mark texts as favorites for quick access |
| **Create category** | Add new category/subcategory with icon selection |
| **Sort** | Alphabetical sorting within categories and subcategories |

#### Import Functionality
- Support file formats: `.txt`, `.go`, `.ts`, `.js`, `.py`, `.md`, etc.
- Auto-detect programming language from file extension
- Suggest category based on file type
- Preserve original formatting (spaces, indentation)

---