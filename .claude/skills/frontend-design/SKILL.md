---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, go through this process to define a strong visual identity:

### 1. Understand Context
- **Purpose**: What problem does this interface solve? Who uses it?
- **Audience**: What is the user's mental model, taste level, and expectation?
- **Constraints**: Technical requirements (framework, performance, accessibility).

### 2. Collect References & Inspiration
Search for visual references before writing a single line of code. Think across:
- **Graphic design**: editorial layouts, poster design, type specimens
- **Web**: Awwwards, Httpster, Siteinspire, Brutalist Websites, Land-book
- **Art & culture**: film stills, album covers, architectural photography, fashion lookbooks
- **Adjacent industries**: packaging, signage, print — anything that captures the right feeling

Ask: *What does this remind me of? What mood does it evoke? What era or culture does it belong to?*

### 3. Define Visual Identity
Commit to a BOLD aesthetic direction before touching code:
- **Tone**: Pick an extreme and own it — brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc.
- **Mood board**: 3–5 adjectives that describe the visual feeling (e.g. "heavy, monochromatic, confrontational" or "airy, botanical, unhurried")
- **Visual language**: Define the core visual elements — typeface personality, color story, spatial rhythm, texture quality
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

### 4. Commit & Validate Direction

Before writing code, write a one-sentence design brief:
> *"This interface feels like [reference/analogy], using [key visual elements] to communicate [mood/tone] to [audience]."*

Example: *"This dashboard feels like a 1970s Swiss train schedule — monospaced type, strict grid, high-contrast black on cream — communicating precision and reliability to operations teams."*

Then stress-test the direction with these questions:
- **Is it specific?** Could this description apply to any other design? If yes, sharpen it.
- **Is it justified?** Does the direction make sense for the purpose and audience?
- **Is it executable?** Can you concretely translate this into typography, color, and layout decisions?
- **Is it committed?** Are you willing to fully follow this direction, even where it's uncomfortable?

If any answer is "no", refine the direction before proceeding. Vague direction = generic output.

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

### Aesthetic Quality Bar

**Good design feels like**: it could only exist for this specific purpose, in this specific context. It has a point of view. It has taste.

**Bad design feels like**: it could be swapped with any other design. Generic. Forgettable. Assembled from defaults.

Concrete signs of weak aesthetic judgment to actively avoid:
- Overused font families: Inter, Roboto, Arial, system-ui, Space Grotesk
- Clichéd color schemes: purple gradients on white, teal/coral combos, flat blue CTAs
- Predictable layouts: hero + 3 feature cards + footer
- Default shadows, border-radius, and spacing that look like a UI kit
- Animations that serve no purpose (fade-ins on everything)

NEVER use generic AI-generated aesthetics. Every design decision should be deliberate and context-specific.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.
