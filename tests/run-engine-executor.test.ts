import { describe, it, expect, vi } from 'vitest'
import { RunEngine } from '../app/run-engine/engine'

const AGENT_ID = 'agent-alice'
const AGENT_NAME = 'Alice'
const AGENT_ROLE = 'Explorer'
const TASK = 'Explore sector 7'

// ---------------------------------------------------------------------------
// RunEngine — executor pattern (real LLM integration)
// ---------------------------------------------------------------------------

describe('RunEngine.startRun with executor', () => {
  it('calls the executor and completes the run with its result', async () => {
    const engine = new RunEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)

    const executor = vi.fn().mockResolvedValue('LLM result here')

    const completedHandler = vi.fn()
    engine.on('run:completed', completedHandler)

    engine.startRun(run.id, executor)

    // Run transitions to 'running' immediately
    expect(engine.getRun(run.id)!.status).toBe('running')
    expect(executor).toHaveBeenCalledOnce()

    // Wait for the async executor to resolve
    await vi.waitFor(() => {
      expect(engine.getRun(run.id)!.status).toBe('completed')
    })

    expect(engine.getRun(run.id)!.result).toBe('LLM result here')
    expect(completedHandler).toHaveBeenCalledOnce()
    expect(completedHandler.mock.calls[0][0].result).toBe('LLM result here')
  })

  it('fails the run when executor throws', async () => {
    const engine = new RunEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)

    const executor = vi.fn().mockRejectedValue(new Error('API key missing'))

    const failedHandler = vi.fn()
    engine.on('run:failed', failedHandler)

    engine.startRun(run.id, executor)

    await vi.waitFor(() => {
      expect(engine.getRun(run.id)!.status).toBe('failed')
    })

    expect(engine.getRun(run.id)!.error).toBe('API key missing')
    expect(failedHandler).toHaveBeenCalledOnce()
    expect(failedHandler.mock.calls[0][0].error).toBe('API key missing')
  })

  it('uses a non-Error thrown value as a generic error message', async () => {
    const engine = new RunEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)

    const executor = vi.fn().mockRejectedValue('string error')

    engine.startRun(run.id, executor)

    await vi.waitFor(() => {
      expect(engine.getRun(run.id)!.status).toBe('failed')
    })

    expect(engine.getRun(run.id)!.error).toContain('neočekávaná chyba')
  })

  it('does not set a completion glow when failed (error field is set, result is not)', async () => {
    const engine = new RunEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)

    const executor = vi.fn().mockRejectedValue(new Error('failure'))
    engine.startRun(run.id, executor)

    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('failed'))

    const failed = engine.getRun(run.id)!
    expect(failed.result).toBeUndefined()
    expect(failed.error).toBeDefined()
    expect(failed.completedAt).toBeDefined()
  })

  it('emits run:failed NOT run:completed when executor throws', async () => {
    const engine = new RunEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)

    const completedHandler = vi.fn()
    const failedHandler = vi.fn()
    engine.on('run:completed', completedHandler)
    engine.on('run:failed', failedHandler)

    engine.startRun(run.id, vi.fn().mockRejectedValue(new Error('err')))

    await vi.waitFor(() => expect(failedHandler).toHaveBeenCalledOnce())
    expect(completedHandler).not.toHaveBeenCalled()
  })

  it('without executor uses the mock timeout path (backward compatible)', async () => {
    vi.useFakeTimers()
    const engine = new RunEngine({ delayFn: () => 0 })
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)

    engine.startRun(run.id) // no executor → mock mode

    vi.runAllTimers()

    expect(engine.getRun(run.id)!.status).toBe('completed')
    expect(engine.getRun(run.id)!.result).toContain(AGENT_NAME)

    vi.useRealTimers()
  })
})
