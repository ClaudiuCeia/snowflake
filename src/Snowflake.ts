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
 *
 * This layout allows for 4096 unique IDs to be generated per millisecond per
 * machine, and a maximum of 4096 machines - max 16,777,216 unique IDs per
 * millisecond.
 */
import { FNV } from "https://deno.land/x/fnv@v0.0.3/mod.ts";

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
  private static defaultTimeOffset = new Date("01-01-2023").valueOf();
  public readonly nodeID: number;
  public readonly timeOffset: number;
  private static instance?: Snowflake;

  private lastTimestamp: bigint;
  private lastSequence: bigint;

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

    this.lastTimestamp = 0n;
    this.lastSequence = -1n;
  }

  public static get(opts?: Partial<SnowflakeOpts>): Snowflake {
    if (Snowflake.instance) {
      return Snowflake.instance;
    }

    Snowflake.instance = new Snowflake(opts?.nodeID, opts?.timeOffset);
    return Snowflake.instance;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async genNewID(): Promise<bigint> {
    const TIMESTAMP_LEFT_SHIFT = NODE_ID_BITS + SEQUENCE_BITS;
    const NODE_ID_SHIFT = SEQUENCE_BITS;
  
    let timestamp = BigInt(Date.now() - this.timeOffset);
    let sequence = this.lastSequence;
  
    // If the timestamp hasn't changed since the last ID generation,
    // increment the sequence number.
    if (timestamp === this.lastTimestamp) {
      sequence++;
      if (sequence > maxSequence) {
        // If the sequence number exceeds the maximum, wait until the next
        // millisecond to reset it.
        do {
          await this.sleep(1);
          timestamp = BigInt(Date.now() - this.timeOffset);
        } while (timestamp === this.lastTimestamp);
        sequence = 0n;
      }
    } else {
      // If the timestamp has changed, reset the sequence number.
      sequence = 0n;
    }
  
    this.lastTimestamp = timestamp;
    this.lastSequence = sequence;
  
    return (timestamp << TIMESTAMP_LEFT_SHIFT)
      | (BigInt(this.nodeID) << NODE_ID_SHIFT)
      | sequence;
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
