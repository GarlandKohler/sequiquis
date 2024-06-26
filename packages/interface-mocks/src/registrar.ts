import type { IncomingStreamData, Registrar, StreamHandler, Topology, StreamHandlerOptions, StreamHandlerRecord } from '@libp2p/interface-registrar'
import type { Connection } from '@libp2p/interface-connection'
import type { PeerId } from '@libp2p/interface-peer-id'
import merge from 'merge-options'

export class MockRegistrar implements Registrar {
  private readonly topologies: Map<string, Array<{ id: string, topology: Topology }>> = new Map()
  private readonly handlers: Map<string, StreamHandlerRecord> = new Map()

  getProtocols () {
    return Array.from(this.handlers.keys()).sort()
  }

  async handle (protocol: string, handler: StreamHandler, opts?: StreamHandlerOptions): Promise<void> {
    const options = merge.bind({ ignoreUndefined: true })({
      maxInboundStreams: 1,
      maxOutboundStreams: 1
    }, opts)

    if (this.handlers.has(protocol)) {
      throw new Error(`Handler already registered for protocol ${protocol}`)
    }

    this.handlers.set(protocol, {
      handler,
      options
    })
  }

  async unhandle (protocol: string) {
    this.handlers.delete(protocol)
  }

  getHandler (protocol: string) {
    const handler = this.handlers.get(protocol)

    if (handler == null) {
      throw new Error(`No handler registered for protocol ${protocol}`)
    }

    return handler
  }

  async register (protocol: string, topology: Topology) {
    const id = `topology-id-${Math.random()}`
    let topologies = this.topologies.get(protocol)

    if (topologies == null) {
      topologies = []
    }

    topologies.push({
      id,
      topology
    })

    this.topologies.set(protocol, topologies)

    return id
  }

  unregister (id: string | string[]) {
    if (!Array.isArray(id)) {
      id = [id]
    }

    id.forEach(id => this.topologies.delete(id))
  }

  getTopologies (protocol: string) {
    return (this.topologies.get(protocol) ?? []).map(t => t.topology)
  }
}

export function mockRegistrar () {
  return new MockRegistrar()
}

export async function mockIncomingStreamEvent (protocol: string, conn: Connection, remotePeer: PeerId): Promise<IncomingStreamData> {
  return {
    ...await conn.newStream([protocol]),
    // @ts-expect-error incomplete implementation
    connection: {
      remotePeer
    }
  }
}
