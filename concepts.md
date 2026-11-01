# actual plan

## modes
- edit mode
    - vim normal mode
    - vim insert mode
    - vim command mode
    - vim visual mode
- pan mode
- command mode


## edit mode
Edit diagrams and text within them. 
I need vim motions and basic vim keybindings within the box. 

Most keybindings in neovim/vim applies here. Basically it is a text editor when inside a block. Upon focus (selection) on a block, if user presses `Enter` or `i`, It goes into edit mode inside the block, then switches to `insert` mode of vim. All keybindings and modes of vim applies inside this mode. vim modes are like sub-modes inside the edit modes. To exit edit mode, press <escape> inside the normal mode of vim mode. If implementing this is tedious, keep basic vim-motions and modes in v1.
Nice addition is to have the option to remap the escape key (switching to normal mode) to another key that does not conflict with existing bindings -- keep this as a low priority, not immediately needed. 

## pan mode
pan around, zoom, and cycle focus across each block, then press Enter to go into edit mode to edit them. Can also have keybindings like `a` in pan mode to quickly enter into edit mode and start typing to create a new block. Keybindings will be brainstormed in later section of this document.

## command mode
execute commands. When in normal mode, press `:` to enter command mode. This brings the cursor to statusline at the bottom and command typed here will be executed upon pressing Enter. The detailed list of commands will be brainstormed later.


## keybindings

| mode | key | description |
|---|---|---|
| normal | `i` | Enter into edit mode in the same block, then enter into `insert` mode of vim |
| normal | `aa` | create a new block, go into edit mode inside the new block and enter into vim `insert` mode to edit text. |
| normal | `al` | create a new block which links to the current block in selection, go into edit mode inside the new block and enter into vim `insert` mode to edit text. Links are shown as a line connector between blocks |
| normal | `atl` | create a new block which links to the current block in selection, go into simple edit mode on the connection (edge) to type a link text, then upon pressing enter move the focus to the new block and go into edit mode inside the new block and enter into vim `insert` mode to edit text. Links are shown as a line connector between blocks |
