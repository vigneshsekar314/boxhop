# Explaining a concept

type -> explain -> type another block with or without connecting to previous block -> explain -> highlight a block -> add some additional notes 

### simple actions
add
remove
edit
focus (entity is in selection)
    - focus by search
    - focus by cycle (focus by cycling to the next / previous entity)
    - focus multiple
cycle (focus on the next/prev entity)
move (move an entity on a canvas)
search
link
zoom
pan
center (pan view with the focussed entity on the center)
filter (make other entities disappear)
highlight (eg., highlight multiple entities using an animation on the border of the entity to emphasis)

### action categories
motion
mutation
view

### pattern brainstorming
an action enters into a mode
that mode dictates what a keybinding will do
a keybinding will do a motion or mutation
which again transitions to a different state or may remain in the same state
eg., in vim, pressing `c<motion>` in normal mode cuts a sequence of character and enters into insert mode. pressing `a` moves the cursor by one space and enters into insert mode.

### action prefix and suffix
when an action requires (depends) on one / multiple entities, they should be supplied before actions can be executed.
Eg., focus requires the input: which entity to focus?
they can be supplied using actions such as cycle and search
cycle requires input which list/queue to work on?
this can either be a filtered list or a bookmarked queue

### complex actions
add_link
add_focus
focus_center (select an entity and pan to the entity at the center)
add_move
search_focus
search_focus_pan
cycle_pan
search_highlight
search_filter

### entities

block
note
link
diagram
meta

#### meta entities
focus_queue (more like bookmarking and adding a list of entities to navigate with focus using next/prev commands)


## actual plan

### modes
- edit mode
    - vim normal mode
    - vim insert mode
    - vim command mode
    - vim visual mode
- pan mode
- command mode


### edit mode
Edit diagrams and text within them. 
I need vim motions and basic vim keybindings within the box. 

Most keybindings in neovim/vim applies here. Basically it is a text editor when inside a block. Upon focus (selection) on a block, if user presses `Enter` or `i`, It goes into edit mode inside the block, then switches to `insert` mode of vim. All keybindings and modes of vim applies inside this mode. vim modes are like sub-modes inside the edit modes. To exit edit mode, press <escape> inside the normal mode of vim mode. If implementing this is tedious, keep basic vim-motions and modes in v1.
Nice addition is to have the option to remap the escape key (switching to normal mode) to another key that does not conflict with existing bindings -- keep this as a low priority, not immediately needed. 

### pan mode
pan around, zoom, and cycle focus across each block, then press Enter to go into edit mode to edit them. Can also have keybindings like `a` in pan mode to quickly enter into edit mode and start typing to create a new block. Keybindings will be brainstormed in later section of this document.

### command mode
execute commands. When in normal mode, press `:` to enter command mode. This brings the cursor to statusline at the bottom and command typed here will be executed upon pressing Enter. The detailed list of commands will be brainstormed later.


### keybindings

| mode | key | description |
|---|---|---|
| normal | `i` | Enter into edit mode in the same block, then enter into `insert` mode of vim |
| normal | `aa` | create a new block, go into edit mode inside the new block and enter into vim `insert` mode to edit text. |
| normal | `al` | create a new block which links to the current block in selection, go into edit mode inside the new block and enter into vim `insert` mode to edit text. Links are shown as a line connector between blocks |
| normal | `atl` | create a new block which links to the current block in selection, go into simple edit mode on the connection (edge) to type a link text, then upon pressing enter move the focus to the new block and go into edit mode inside the new block and enter into vim `insert` mode to edit text. Links are shown as a line connector between blocks |







