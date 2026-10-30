# Big Text - Tool Specification

## 1. Functional Requirements
- **Text Input**: Users can enter text into a clear, prominent input field.
- **Quick-Select Presets**: A set of commonly used text/emoji buttons (e.g., 'Yes', 'No', '🍺 1 more please') for instant display.
- **Theme Selection**: A concise set of high-contrast themes (e.g., Light on Dark, Dark on Light, Green on Black, Yellow on Black).
- **Dynamic Font Sizing**: The entered text must automatically resize to fill as much of the viewport as possible without overflowing. A responsive padding (minimum 16px to 5% of viewport width) SHALL be maintained to ensure text never touches the screen edges. Natural words SHALL NOT break mid-word; font size scales down so each word fits horizontally on a single line. Extremely long unbroken strings that exceed container width at minimum font size (16px) wrap or truncate gracefully.
- **Toggle Display Mode**: A clear switch between "Editing" and "Displaying" modes.
- **Persistence**: Store the last entered text and theme in `localStorage`.

## 2. UI/UX Requirements
- **Minimalist Aesthetic**: Focus entirely on the text with no unnecessary UI elements in "Displaying" mode.
- **High Contrast**: Ensure maximum readability in different lighting conditions.
- **Aesthetic Touches**: Use subtle gradients or stylized CSS shapes for a modern feel.
- **Responsive Design**: Work perfectly on all screen sizes and orientations.

## 3. Technical Constraints
- **Modular Component**: Lives within `src/tools/big/`.
- **Vanilla CSS**: Styled using `BigText.css`.
- **Test Coverage**: >80% code coverage.
