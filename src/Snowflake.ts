/**
 * Snowflake aims to be a lightweight uncoordinated, distributed
 * unique ID generated, which generates roughly ordered 64 bit integer IDs.
 *
 * An implementation of Twitter's Snowflake:
 * https://blog.twitter.com/engineering/en_us/a/2010/announcing-snowflake.html
 *
 * Parts:
 *   - sign bit: always 0
 *   - next 42 bits: timestamp
 *   - next 12 bits: machine id
 *   - lowest 10 bits: sequence id
 *
 *
 *                    timestamp                |  machine id  |  sequence
 * |                             1597403879758 |         4090 |        567
 * | ----------------------------------------- | ------------ | ----------
 * | 10111001111101100101100001101100101001110 | 111111111010 | 1000110111
 *
 * ID: 6699997482488687159
 */
import { FNV } from "https://deno.land/x/fnv@v0.0.1/src/mod.ts";
import { sleep } from "https://deno.land/x/sleep@v1.2.0/mod.ts";

const TOTAL_BITS = 64n;
const EPOCH_BITS = 42n;
const NODE_ID_BITS = 12n;
const SEQUENCE_BITS = 10n;

const maxNodeID = (1n << NODE_ID_BITS) - 1n;
const maxSequence = (1n << SEQUENCE_BITS) - 1n;

type SnowflakeOpts = {
  nodeID: number;
  timeOffset: number;
};

export class Snowflake {
  private static defaultTimeOffset = new Date("01-01-2020").valueOf();
  private lastTime = 0;
  private sequence = 0;
  public readonly nodeID: number;
  public readonly timeOffset: number;
  private static instance?: Snowflake;

  private constructor(nodeID?: number, timeOffset?: number) {
    if (!nodeID) {
      const machineIdent = `${Deno.hostname}::${Deno.pid}`;
      nodeID = Number(FNV.compress(12, FNV.update(machineIdent).value()));
    }

    if (!timeOffset) {
      timeOffset = Snowflake.defaultTimeOffset;
    }

    this.timeOffset = timeOffset;
    this.nodeID = nodeID & Number(maxNodeID);
  }

  public static get(opts?: Partial<SnowflakeOpts>): Snowflake {
    if (Snowflake.instance) {
      return Snowflake.instance;
    }

    Snowflake.instance = new Snowflake(
      opts?.nodeID,
      opts?.timeOffset
    );
    return Snowflake.instance;
  }

  public async genNewID(): Promise<bigint> {
    const now = Date.now() - this.timeOffset;

    if (this.lastTime === now) {
      this.sequence = (this.sequence + 1) & Number(maxSequence);
      // Can't generate more unique IDs during this millisecond, take a nap
      if (!this.sequence) {
        await sleep(1 / 1000);
      }
    } else {
      this.sequence = 0;
    }

    this.lastTime = now;

    let id: bigint; // potentially a 64 bit ID
    id = BigInt(now) << (TOTAL_BITS - EPOCH_BITS);
    id |= BigInt(this.nodeID) << (TOTAL_BITS - EPOCH_BITS - NODE_ID_BITS);
    id |= BigInt(this.sequence);

    return id;
  }

  public static getTimestampFromID(id: bigint, timeOffset?: number): number {
    if (!timeOffset) {
      timeOffset = Snowflake.defaultTimeOffset;
    }
    const timestamp = BigInt.asUintN(
      Number(EPOCH_BITS),
      id >> (TOTAL_BITS - EPOCH_BITS)
    );

    return Number(timestamp) + timeOffset;
  }

  public static getNodeIDFromID(id: bigint): number {
    const nodeID = BigInt.asUintN(
      Number(NODE_ID_BITS),
      (id << EPOCH_BITS) >> (EPOCH_BITS + SEQUENCE_BITS)
    );

    return Number(nodeID);
  }

  public static getSequenceFromID(id: bigint): number {
    const BITS = TOTAL_BITS - SEQUENCE_BITS;
    const sequence = BigInt.asUintN(
      Number(SEQUENCE_BITS),
      (id << BITS) >> BITS
    );

    return Number(sequence);
  }
}
