import { Dispatch, SetStateAction, useEffect, useState } from "react";

// Adapted from https://karthikraja555.medium.com/react-js-debouncing-or-delaying-value-change-using-custom-hook-1d5fb2e4fe79
const useDebounce = <T extends string | string[]>(
  initialState: T,
  delay: number
): [T, Dispatch<SetStateAction<T>>] => {
  const [actualValue, setActualValue] = useState<T>(initialState);
  const [debounceValue, setDebounceValue] = useState<T>(initialState);

  useEffect(() => {
    const debounceId = setTimeout(() => setDebounceValue(actualValue), delay);
    return () => clearTimeout(debounceId);
  }, [actualValue, delay]);

  return [debounceValue, setActualValue];
};

export default useDebounce;
