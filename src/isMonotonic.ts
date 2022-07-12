export const isMonotonic = (array: (number | bigint)[]): boolean => {
  return array.every((val, idx, arr) => {
    if (idx) {
      return val > arr[idx - 1];
    }

    return true;
  });
};
