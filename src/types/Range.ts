// For A being ["foo", "bar"], it will prepend the length of A:
// [2, "foo", "bar"]
type PrependLength<A extends Array<unknown>> = A["length"] extends infer T
  ? ((t: T, ...a: A) => void) extends (...x: infer X) => void
    ? X
    : never
  : never;

// Recursively prepend the length of A until it reaches N
type EnumerateInternal<A extends Array<unknown>, N extends number> = {
  0: A;
  1: EnumerateInternal<PrependLength<A>, N>;
}[N extends A["length"] ? 0 : 1];

// Returns a union type of all the values from 0 to N
export type Enumerate<N extends number> = EnumerateInternal<
  [],
  N
> extends (infer E)[]
  ? E
  : never;

// Returns a union type of all the values from FROM to TO
export type Range<FROM extends number, TO extends number> = Exclude<
  Enumerate<TO>,
  Enumerate<FROM>
>;
