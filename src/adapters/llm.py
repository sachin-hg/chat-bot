"""AnthropicLLM — streaming LLM adapter implementing LLMPort."""
from __future__ import annotations
import asyncio
from typing import Any, Callable, Optional
import anthropic
from src.observability.logging import get_logger

try:
    from langsmith import traceable as _traceable
except ImportError:
    def _traceable(*args, **kwargs):               # type: ignore[misc]
        def _wrap(fn): return fn
        return _wrap if args and callable(args[0]) else _wrap

log = get_logger(__name__)

_client: Optional[anthropic.AsyncAnthropic] = None

def _get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic()
    return _client


class AnthropicLLM:
    """Streaming LLM adapter. Calls Claude via Anthropic streaming API.
    on_chunk(text) called per delta; on_tool_use(tool, params) called on tool use.
    Returns: {'response': {'text': str, 'stop_reason': str}, 'tool_results': list}
    """

    @_traceable(run_type="llm", name="llm_stream")
    async def stream(
        self,
        model: str,
        system: str,
        messages: list,
        tools: list,
        on_chunk: Callable[[str], None] = None,
        on_tool_use: Callable = None,
    ) -> dict:
        client = _get_client()
        full_text: list[str] = []
        tool_results: list[dict] = []

        anthropic_tools = [t for t in (tools or []) if isinstance(t, dict) and 'name' in t]

        try:
            kwargs: dict = dict(
                model=model,
                max_tokens=1024,
                system=system or 'You are a helpful real estate assistant.',
                messages=messages or [{'role': 'user', 'content': 'Hello'}],
            )
            if anthropic_tools:
                kwargs['tools'] = anthropic_tools

            async with client.messages.stream(**kwargs) as stream:
                async for event in stream:
                    if event.type == 'content_block_delta':
                        delta = event.delta
                        if hasattr(delta, 'text') and delta.text:
                            full_text.append(delta.text)
                            if on_chunk:
                                on_chunk(delta.text)

                final_msg = await stream.get_final_message()

                for block in (final_msg.content or []):
                    if block.type == 'tool_use' and on_tool_use:
                        try:
                            tool_input = block.input if isinstance(block.input, dict) else {}
                            result = await on_tool_use(block.name, tool_input)
                            tool_results.append({'tool': block.name, 'result': result, 'tool_use_id': block.id})
                        except Exception as exc:
                            log.warn('tool_call_failed', tool=block.name, error=str(exc))

            usage = getattr(final_msg, 'usage', None)
            return {
                'response':    {'text': ''.join(full_text), 'stop_reason': final_msg.stop_reason},
                'tool_results': tool_results,
                'usage': {
                    'input_tokens':  getattr(usage, 'input_tokens',  0) if usage else 0,
                    'output_tokens': getattr(usage, 'output_tokens', 0) if usage else 0,
                },
            }

        except anthropic.APIError as exc:
            log.error('llm_api_error', model=model, error=str(exc))
            return {'response': {'text': ''}, 'tool_results': []}
        except Exception as exc:
            log.error('llm_stream_error', model=model, error=str(exc))
            return {'response': {'text': ''}, 'tool_results': []}
