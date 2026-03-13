const crypto = require('crypto');
const dgram = require('dgram');
const EventEmitter = require('events');

class DNSEncryption {
    constructor(sharedSecret) {
        this.algorithm = 'aes-256-cbc';
        this.sharedSecret = Buffer.from(sharedSecret || crypto.randomBytes(32).toString('hex'), 'hex');
    }

    encrypt(data) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.sharedSecret.slice(0, 32), iv);
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return { iv: iv.toString('hex'), encrypted };
    }

    decrypt(encrypted, iv) {
        const decipher = crypto.createDecipheriv(
            this.algorithm,
            this.sharedSecret.slice(0, 32),
            Buffer.from(iv, 'hex')
        );
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return JSON.parse(decrypted);
    }
}

class P2PMeshNetwork extends EventEmitter {
    constructor(port, peerId, sharedSecret) {
        super();
        this.port = port;
        this.peerId = peerId || crypto.randomBytes(16).toString('hex');
        this.peers = new Map();
        this.server = dgram.createSocket('udp4');
        this.encryption = new DNSEncryption(sharedSecret || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
    }

    start() {
        this.server.on('message', (msg, rinfo) => {
            try {
                const payload = JSON.parse(msg.toString());
                // Handle unencrypted payload for simple discovery, or encrypted for sensitive data
                if (payload.encrypted) {
                    const decrypted = this.encryption.decrypt(payload.encrypted, payload.iv);
                    this.emit('message', decrypted, rinfo);
                } else {
                    this.emit('message', payload, rinfo);
                }

                // Auto-add peer if not known
                const peerKey = `${rinfo.address}:${rinfo.port}`;
                if (!this.peers.has(peerKey) && payload.peerId !== this.peerId) {
                    console.log(`🌐 Peer discovered via message: ${peerKey}`);
                    this.peers.set(peerKey, { host: rinfo.address, port: rinfo.port, peerId: payload.peerId });
                }
            } catch (e) {
                // console.log('❌ Failed to parse mesh message', e.message);
            }
        });

        this.server.bind(this.port, '0.0.0.0', () => {
            console.log(`✅ UDP Mesh Network listening on port ${this.port}`);
            // Broadcast discovery
            this.broadcast({ type: 'DISCOVERY', status: 'online' });
        });
    }

    broadcast(message) {
        const payload = this.encryption.encrypt({
            peerId: this.peerId,
            timestamp: Date.now(),
            ...message
        });

        // Also include plaintext wrapper so we know it's encrypted
        const msg = Buffer.from(JSON.stringify({
            peerId: this.peerId,
            ...payload
        }));

        this.peers.forEach((peer) => {
            this.server.send(msg, 0, msg.length, peer.port, peer.host, (err) => {
                if (err) console.error('❌ Failed to send to peer:', err.message);
            });
        });
    }

    addPeer(host, port) {
        const peerKey = `${host}:${port}`;
        if (!this.peers.has(peerKey)) {
            this.peers.set(peerKey, { host, port });
            console.log(`✅ Connected to peer manually: ${peerKey}`);
            // Say hello
            const msg = Buffer.from(JSON.stringify({ type: 'DISCOVERY', peerId: this.peerId, status: 'online' }));
            this.server.send(msg, 0, msg.length, port, host);
        }
    }

    stop() {
        this.server.close();
    }
}

module.exports = { DNSEncryption, P2PMeshNetwork };
