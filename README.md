# yasi- yet another snowflake implementation

`yasi` is a Deno library for generating unique, roughly time-ordered IDs across distributed systems. The library is based on Twitter's Snowflake, a network service for generating unique ID numbers at high scale with some simple guarantees.

This project aims to be a lightweight, uncoordinated, and distributed unique ID generator, capable of producing unique 64-bit integer IDs.

Features
  - Lightweight: A single tiny external dependency which will be removed in the future
  - Unique ID generation: Generates unique IDs across distributed systems
  - Uncoordinated: No need for system-wide coordination
  - Roughly time-ordered: IDs generated are roughly ordered over time

## Installation

```ts
import { Snowflake } from "https://deno.land/x/snowflake@v0.0.10/mod.ts";;
```

## Usage

```ts
const snowflake = Snowflake.get({ nodeID: 1234, timeOffset: Date.now() });
const id = await snowflake.genNewID();
```

## API

For detailed API documentation, please check the source code.

## Future development

  - Custom Epoch: Allow setting a custom epoch. This could help save some bits for either the sequence number or the machine ID, depending on requirements.
  - Benchmarks: Include benchmark tests to determine how many IDs can be generated in a certain timeframe.
  - More safety checks: Include safety checks, such as checking if the machine/node ID exceeds the maximum number that can be held in the assigned bits.
  - Configurable bits for each segment: Allow configuring the number of bits for each segment of the ID (timestamp, node ID, sequence). 
  - Multi-node tests: Simulate the generation of IDs across multiple nodes to ensure that the IDs are indeed unique across nodes and are roughly ordered.

## Contributing

Contributions are welcome! Please feel free to submit a pull request.

## License

MIT © [Claudiu Ceia](https://github.com/ClaudiuCeia)