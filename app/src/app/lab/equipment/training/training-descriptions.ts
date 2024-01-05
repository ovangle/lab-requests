export function parseTrainingDescriptions(input: string): string[] {
  const descriptions = [];
  let currentItem = '';
  for (let component of input.split('\n')) {
    // If this is a new list entry
    if (component.startsWith('-')) {
      if (currentItem) {
        descriptions.push(currentItem);
        currentItem = '';
      }
      component = component.substring(1).trimStart();
    } else {
      // Otherwise it's a continuation of the previous and we removed a newline
      if (currentItem) {
        currentItem += '\n';
      }
    }
    currentItem += component;
  }
  if (currentItem) {
    descriptions.push(currentItem);
  }
  return descriptions;
}
