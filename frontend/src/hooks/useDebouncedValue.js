import { useEffect, useState } from "react";
function useDebouncedValue(value, delayMs = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
export {
  useDebouncedValue
};
