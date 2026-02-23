
import { describe, it, expect } from 'vitest';
import { ExecutionContextHost } from '../execution-context-host';

describe('ExecutionContextHost', () => {
  it('should return context type', () => {
    const context = new ExecutionContextHost([]);
    expect(context.getType()).toBe('http');
  });

  it('should return http arguments', () => {
    const req = { method: 'GET' };
    const res = { send: () => { } };
    const next = () => { };
    const context = new ExecutionContextHost([req, res, next]);

    const http = context.switchToHttp();
    expect(http.getRequest()).toBe(req);
    expect(http.getResponse()).toBe(res);
    expect(http.getNext()).toBe(next);
    expect(context.getRequest()).toBe(req);
    expect(context.getResponse()).toBe(res);
  });

  it('should support switching to ws', () => {
    const client = { id: 'socket-1' };
    const data = { event: 'message' };
    const context = new ExecutionContextHost([client, data], null, null, 'ws');

    expect(context.getType()).toBe('ws');
    const ws = context.switchToWs();
    expect(ws.getClient()).toBe(client);
    expect(ws.getData()).toBe(data);
  });
});
