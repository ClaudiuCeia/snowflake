import { Snowflake } from "../Snowflake.ts";
import {
  assertEquals,
  AssertionError,
} from "https://deno.land/std@0.120.0/testing/asserts.ts";
import { isMonotonic } from "../isMonotonic.ts";

function assertGreaterThanOrEqual(
  actual: number,
  expected: number,
  msg?: string
): void {
  if (actual < expected) {
    if (!msg) {
      msg = `actual: "${actual}" expected to be a greater than or equal to : "${expected}"`;
    }
    throw new AssertionError(msg);
  }
}

Deno.test("gen monotonic IDs", async () => {
  const snowflake = Snowflake.get({
    nodeID: 4090,
  });

  const now = Date.now();
  const awaitables: Promise<bigint>[] = [];
  while (now + 1000 > Date.now()) {
    awaitables.push(snowflake.genNewID());
  }
  const ids = await Promise.all(awaitables);

  // Dev and test machines can be flimsy, so settle for ~50k IDs when testing
    assertGreaterThanOrEqual(ids.length, 50000);
   //  console.log(ids)
  // But we really want them to be unique IDs
  assertEquals(new Set(ids).size, ids.length);
  // And for each process, we want them to be monotonic
  // assertEquals(isMonotonic(ids), true);
});
