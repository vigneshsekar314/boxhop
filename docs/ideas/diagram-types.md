# Boxhop ideas: diagram types for explaining concepts

**Status:** Product brainstorming, not a committed roadmap. This document describes diagram forms Boxhop could help users build and the reusable capabilities they may require. It is deliberately broader than mind mapping.

## Product intent

Boxhop should make it easy to explain an idea with a diagram, starting immediately and adding structure only when useful. It should not require sign-in or make users choose a diagram type before they can begin. Keyboard use should feel intuitive to Vim users and reward learning, while keybindings remain configurable rather than fixed forever.

The experience should support both a concise big-picture view and a path into details. Blocks and links are the starting point; hierarchy, containment, tables, lists, tags, and Markdown detail may be useful as a diagram grows. The goal is not to implement every specialized notation, but to make common explanation patterns effortless through reusable primitives.

## Current prototype boundary

The current prototype has text blocks, links, link labels, keyboard navigation and editing, canvas positioning, and a Markdown preview pane. The ideas below are future possibilities unless already listed here. In particular, containment, native tables/lists, tags, specialized layouts, and dedicated diagram notation are not implied to exist today.

## Shared building blocks

- **Block:** a concept, step, person, state, system, data entity, or other item.
- **Link:** a relationship between blocks; it may be directed and may have a label.
- **Containment/group:** a way to show that items belong within a larger concept, system, lane, or boundary.
- **Structured content:** lists, tables, attributes, dates, tags, and other typed details.
- **Detail pane:** longer Markdown supporting text attached to a block without crowding the diagram.
- **Layout:** spatial arrangements such as tree, timeline, grid, sequence, or lanes.
- **View controls:** focus, search, highlight, filter, zoom, pan, and center.

## Learning and concept explanation

### 1. Concept map

**Use:** Show concepts and the meaningful relationships among them; suitable for networks of ideas, not only trees.

**Build it:**
1. Add a block for the central concept.
2. Add blocks for the most important related concepts around it.
3. Connect related concepts, including non-adjacent ones.
4. Label important links with phrases such as “causes,” “is an example of,” or “requires.”
5. Put definitions, examples, and caveats in block details when they would clutter the canvas.
6. Read each connection as a sentence to check that its meaning is clear.

**Boxhop needs:** Free-form links, link labels, search, and optional highlighting.

### 2. Hierarchy or taxonomy

**Use:** Show categories, levels, classifications, or “types of.”

**Build it:**
1. Add a block for the broad category.
2. Add a block for each major subcategory.
3. Connect each subcategory to its parent and arrange levels consistently.
4. Add another level only when it clarifies the classification.
5. Put examples and qualifications in details rather than creating unnecessary branches.
6. Check that every item has a clear place in the hierarchy.

**Boxhop needs:** Tree layout or explicit parent-child containment, while still permitting cross-links.

### 3. Compare-and-contrast

**Use:** Compare theories, products, people, strategies, or options against shared criteria.

**Build it:**
1. Add a column or group for each item being compared.
2. Choose shared criteria such as cost, purpose, strengths, or limitations.
3. Record each item’s value for every criterion.
4. Mark similarities and differences explicitly.
5. Use a table when there are many repeated values; use connected blocks when relationships themselves are the point.
6. Add a conclusion block that states what the comparison suggests.

**Boxhop needs:** Aligned groups and native tables for larger comparisons.

### 4. Cause-and-effect

**Use:** Explain why an outcome happened or what factors contribute to it.

**Build it:**
1. Add a prominent block for the observed outcome or problem.
2. Add blocks for contributing causes.
3. Connect causes toward the outcome and label ambiguous relationships.
4. Break complex causes into contributing factors.
5. Mark whether causes are evidenced, suspected, or untested.
6. Attach evidence and caveats in details.

**Boxhop needs:** Directional links, grouping, and lightweight status tags. The diagram should not imply that a proposed cause is proven.

### 5. Cycle or feedback loop

**Use:** Explain recurring processes, life cycles, or reinforcing/balancing feedback.

**Build it:**
1. Add a block for each stage or factor.
2. Arrange the blocks around a loop.
3. Connect each stage to the next in the direction of movement.
4. Connect the last stage back to the first.
5. Label triggers or feedback effects.
6. Mark whether the loop reinforces, limits, or simply repeats the behavior.

**Boxhop needs:** Cycles must be valid; automatic tree layouts must not break them.

### 6. Timeline or historical sequence

**Use:** Explain events, milestones, discoveries, or how a situation developed.

**Build it:**
1. Add a block for each event or milestone.
2. Give each item a date, period, or sequence number.
3. Arrange items along a consistent time axis.
4. Connect events in chronological order where the connection helps.
5. Group events into eras or phases if useful.
6. Put background and sources in the detail pane.

**Boxhop needs:** Timeline layout and date/time labels.

### 7. Process or flowchart

**Use:** Explain a procedure, algorithm, or sequence of actions.

**Build it:**
1. Add a start block.
2. Add one block for each action or decision.
3. Connect steps in execution order.
4. Label decision branches with outcomes such as “yes” and “no.”
5. Add an end block for each meaningful outcome.
6. Trace every branch to check it reaches a sensible result.

**Boxhop needs:** Directional links, decision markers, and flow layout.

### 8. Lists and tables

**Use:** Explain ordered items, categories, or repeated fields.

**Build it:**
1. Decide whether the information is an ordered sequence, an unordered set, or repeated fields.
2. Use a numbered list for sequence and bullets for a set.
3. Use a table when every item shares the same columns.
4. Use diagram links only where relationships among items matter.
5. Add a short heading or takeaway.
6. Move long explanations into details.

**Boxhop needs:** Keyboard-editable list and table content. Users should not have to simulate a table with many freeform blocks.

## Teaching, analysis, and management

### 9. Swimlane process

**Use:** Show a process and which person, team, or system owns each step.

**Build it:**
1. Create a lane for each role, team, or system.
2. Add process steps inside the lane responsible for them.
3. Arrange steps chronologically across lanes.
4. Connect steps, including cross-lane handoffs.
5. Label approvals, transfers, or waiting points.
6. Look for steps with unclear ownership or missing handoffs.

**Boxhop needs:** Lanes that group blocks while allowing cross-lane links.

### 10. User or service journey

**Use:** Explain a person’s experience with a product, service, or process over time.

**Build it:**
1. Name the user or persona.
2. Add stages from that person’s point of view.
3. Arrange stages in order.
4. Record the person’s action, need, or question at each stage.
5. Add pain points, emotions, or opportunities as notes or tagged blocks.
6. Highlight the stages where improvement matters most.

**Boxhop needs:** Ordered stages, aligned rows or lanes, and annotations/tags.

### 11. Organization chart

**Use:** Show reporting lines, team structure, or functional ownership.

**Build it:**
1. Add a block for each person, role, or team.
2. Place the highest-level role or group at the top.
3. Connect each role to direct reports or subordinate groups.
4. Add names and responsibilities as details when labels should remain short.
5. Group departments or locations where useful.
6. Distinguish reporting lines from collaboration relationships.

**Boxhop needs:** Hierarchical layout and distinct relationship types.

### 12. Decision tree

**Use:** Explain choices and their possible outcomes.

**Build it:**
1. Add a starting block for the situation.
2. Add a decision block for each question that changes the path.
3. Label outgoing links with answers or conditions.
4. Add an action or outcome at the end of each path.
5. Add another decision where a later choice determines the next step.
6. Test realistic cases by tracing paths from start to outcome.

**Boxhop needs:** Decision markers, labeled branches, and tree layout.

### 13. Cause analysis / fishbone

**Use:** Organize possible causes of a problem into categories before investigating them.

**Build it:**
1. Put the problem or effect at the end of a central line or in a prominent block.
2. Add major cause categories, such as people, process, tools, or environment.
3. Add possible causes under the relevant category.
4. Connect causes to their category and categories to the problem.
5. Mark causes as evidenced, suspected, or untested.
6. Attach evidence and follow-up questions.

**Boxhop needs:** Grouping, labeled relationships, and status tags. The fishbone visual can be optional; organized cause analysis is the essential capability.

### 14. Matrix or quadrant

**Use:** Compare options on two dimensions, such as urgency/importance or impact/effort.

**Build it:**
1. Choose two dimensions and define the low and high ends of each.
2. Create a two-axis area divided into four regions.
3. Add a block for each option, issue, or initiative.
4. Place each block according to both dimensions.
5. Label each quadrant with its meaning.
6. Review whether positions are evidence-based or provisional judgments.

**Boxhop needs:** Grid placement, axis labels, and easy block movement.

### 15. Roadmap or dependency diagram

**Use:** Explain planned work, milestones, dependencies, or delivery sequence.

**Build it:**
1. Add a block for each outcome, milestone, or work item.
2. Arrange major work along a timeline or in phases.
3. Connect dependencies with labeled arrows.
4. Mark milestones distinctly from ongoing work.
5. Add owner, date, or status as metadata or short labels.
6. Distinguish chronological order from dependency; they are not always the same.

**Boxhop needs:** Timeline layout, metadata, and dependency links. Detailed scheduling may warrant a dedicated Gantt view later.

### 16. Stakeholder or influence map

**Use:** Show who is involved, who influences a decision, and where interests or dependencies lie.

**Build it:**
1. Add a block for each stakeholder or stakeholder group.
2. Add the central decision, initiative, or service.
3. Connect stakeholders to it and to one another where appropriate.
4. Label relationships with terms such as “approves,” “funds,” “uses,” or “influences.”
5. Add interests, concerns, or influence level as tags or details.
6. Highlight relationships requiring engagement or clarification.

**Boxhop needs:** Many-to-many links, labels, tags, and highlighting.

## Technical and system explanation

### 17. System context diagram

**Use:** Show a system, its users, and external systems at a high level.

**Build it:**
1. Add a block for the system being explained.
2. Add user, organization, and external-system blocks around it.
3. Connect each actor or system to the central system.
4. Label links with what is exchanged or why the relationship exists.
5. Draw a boundary around the system’s scope.
6. Keep implementation details for a more detailed view.

**Boxhop needs:** Boundaries, link labels, and clear overview/detail levels.

### 18. Container or component architecture

**Use:** Explain the major runtime parts of an application and how they communicate.

**Build it:**
1. Create a boundary for the system.
2. Add a block for each application, service, database, or major component.
3. Group components within the appropriate boundary.
4. Connect communicating components.
5. Label links with protocol, data, or purpose when useful.
6. Split into a deeper component view if the overview becomes crowded.

**Boxhop needs:** Containment, labeled links, and multiple detail levels.

### 19. Sequence diagram

**Use:** Show messages exchanged among people, services, or components over time.

**Build it:**
1. Add a participant for each person or system.
2. Arrange participants across the top.
3. Add interactions from top to bottom in chronological order.
4. Draw each message from sender to receiver and label it.
5. Distinguish responses, asynchronous messages, or alternatives where necessary.
6. Split different scenarios into separate diagrams if the sequence becomes difficult to follow.

**Boxhop needs:** Participant lifelines, time-ordered messages, and a dedicated sequence layout. Freeform blocks can approximate one, but a specialized view would be clearer.

### 20. State-transition diagram

**Use:** Explain the states of an object or system and the events that change them.

**Build it:**
1. List the meaningful states.
2. Add a block for each state.
3. Connect states with arrows for events or conditions that cause a change.
4. Label transitions with their trigger or guard condition.
5. Mark starting and terminal states.
6. Check that important events have a defined outcome and invalid transitions are clear.

**Boxhop needs:** State markers, transition labels, and support for loops.

### 21. Entity-relationship diagram (ERD)

**Use:** Explain data entities and how records relate.

**Build it:**
1. Add a block for each entity, such as Customer, Order, or Product.
2. List important attributes in a structured block or table.
3. Mark key identifiers and other significant fields.
4. Connect related entities.
5. Label relationships with cardinality such as one-to-many or many-to-many.
6. Mark whether each relationship is required or optional.

**Boxhop needs:** Structured attributes, relationship cardinality/optionality, and clear entity styling.

### 22. Class or domain model

**Use:** Explain software-domain concepts, their attributes, and their relationships.

**Build it:**
1. Add a block for each class or domain concept.
2. List important properties and responsibilities.
3. Connect concepts with labels such as “owns,” “uses,” or “inherits from.”
4. Add multiplicity where one or many instances can participate.
5. Distinguish inheritance from ordinary association.
6. Include methods only when the audience needs that level of design detail.

**Boxhop needs:** Structured blocks and multiple relationship styles.

### 23. Data-flow diagram

**Use:** Show where information originates, how it is transformed, and where it goes.

**Build it:**
1. Add blocks for sources, processes, stores, and destinations.
2. Connect them in the direction data moves.
3. Label each link with the data being transferred.
4. Group processes within system boundaries where useful.
5. Check that every input and output has a clear origin or destination.
6. Add privacy, trust, or retention notes when relevant.

**Boxhop needs:** Distinct block roles, directional links, labels, and boundaries.

### 24. Network or infrastructure topology

**Use:** Explain how devices, services, and infrastructure components connect.

**Build it:**
1. Add blocks for relevant devices, services, or infrastructure nodes.
2. Group nodes by environment, location, or trust boundary.
3. Connect nodes that communicate or depend on each other.
4. Label links with network, protocol, or connection purpose.
5. Mark boundaries such as public/private or production/staging.
6. Keep configuration-level details in notes unless they are central to the explanation.

**Boxhop needs:** Boundaries, labeled links, grouping, and optional component icons.

## Reusable capabilities suggested by this catalog

Rather than build a separate application for every diagram name, consider these shared capabilities:

1. **Blocks and arbitrary links** for concepts, steps, systems, people, states, and data.
2. **Optional hierarchy and containment** for taxonomies, lanes, system boundaries, and detail levels.
3. **Structured content** for lists, tables, attributes, dates, and metadata.
4. **Relationship semantics** for labels, direction, cardinality, and relationship styles.
5. **Layout helpers** for trees, timelines, grids, lanes, sequences, and cycles.
6. **Progressive detail** through Markdown notes, focus views, filtering, and highlighting.
7. **Keyboard-first actions** for creating, editing, connecting, navigating, grouping, and rearranging.

## Candidate prioritization

### Validate with the core interaction

- Concept maps
- Flowcharts and decision trees
- Hierarchies/taxonomies
- Cause-and-effect diagrams
- Timelines
- Simple system context and component diagrams

These exercise the fundamental block, link, label, grouping, and layout model.

### Validate before adding specialized layouts

- Tables and compare-and-contrast
- Swimlanes and journeys
- Sequence diagrams
- ERDs and class/domain models
- Quadrants and matrices

These may require structured content or precise layout beyond freeform blocks.

### Consider later based on real use

- Detailed Gantt/project scheduling
- Network topology notation
- Elaborate UML or other formal notations
- Data charts and specialized export formats

These are valuable but may require specialized behavior. Prioritize them when concrete user workflows justify the complexity.

## Product test for each feature

Ask: **Does this help someone explain an idea more clearly, or reach a useful diagram sooner?** If a feature adds setup or complexity without improving either, defer it.

Also ask whether the diagram form can be made useful with reusable Boxhop primitives or genuinely needs a dedicated editor. Prefer reusable primitives unless specialization materially improves clarity or ease of use.
