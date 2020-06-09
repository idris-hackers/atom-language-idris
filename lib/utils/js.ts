// slow method to compare objects.
export const objectEqual = (a: any, b: any) =>
    JSON.stringify(a) === JSON.stringify(b)
