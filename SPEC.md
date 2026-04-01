# Big Text Website Specification

A simple, visually appealing, self-contained static website for displaying large text that fills the screen.

## 1. Functional Requirements
- **Text Input**: Users can enter text into a clear, prominent input field.
- **Quick-Select Presets**: A set of commonly used text/emoji buttons (e.g., 'Yes', 'No', '🍺 1 more please') for instant display.
- **Theme Selection**: A concise set of high-contrast themes (e.g., Light on Dark, Dark on Light, Green on Black, Yellow on Black).
- **Dynamic Font Sizing**: The entered text must automatically resize to fill as much of the viewport as possible without overflowing. A mandatory padding of at least 20px (or 5% of viewport width) SHALL be maintained to ensure text never touches the screen edges.
- **Toggle Display Mode**: A clear switch between "Editing" and "Displaying" modes.
- **Persistence**: Optionally store the last entered text in `localStorage` for quick re-use.

## 2. UI/UX Requirements
- **Minimalist Aesthetic**: Focus entirely on the text with no unnecessary UI elements in "Displaying" mode.
- **High Contrast**: Ensure maximum readability in different lighting conditions (e.g., bright sunlight, dark restaurants).
- **Aesthetic Touches**: Use subtle gradients or stylized CSS shapes for a modern feel.
- **Responsive Design**: Work perfectly on all screen sizes and orientations (especially mobile phones).

## 3. Technical Constraints
- **Self-Contained**: No backend, no external dependencies outside of the final build bundle.
- **Static Output**: Must be deployable as a simple set of static files (HTML, CSS, JS) to Cloudflare Workers using Workers Assets.
- **Technology Stack**:
    - **Framework**: React (TypeScript)
    - **Build Tool**: Vite
    - **Styling**: Vanilla CSS
    - **Hosting**: Cloudflare Workers

## 4. Testing Requirements
- **Unit Testing**: Core logic like font size calculation should be testable.
- **Component Testing**: UI transitions between "Editing" and "Displaying" modes must be verified.
- **Persistence Testing**: Verify that text is correctly saved to and loaded from `localStorage`.
- **Coverage Target**: Aim for >80% code coverage to ensure reliability.
- **CI/CD**: A GitHub Action SHALL be configured to run tests and verify coverage on every pull request and merge to the `main` branch.

## 5. EARS Requirements
- **WHEN** the user types in the input field, **THEN** the system SHALL update the displayed text in real-time.
- **WHEN** the user enters "Displaying" mode, **THEN** the system SHALL hide the input UI and only show the large text.
- **WHEN** the text size changes, **THEN** the system SHALL recalculate the font size to ensure it fills the viewport.
- **WHEN** the screen is rotated, **THEN** the system SHALL re-adjust the font size to fit the new dimensions.
