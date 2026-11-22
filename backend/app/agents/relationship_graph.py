import logging
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from app.agents.state import RelationshipAgentState
from app.agents.nodes import (
    analyze_and_retrieve_node,
    should_trigger_pause,
    generate_pause_scenarios_node,
    generate_standard_qa_node,
)

logger = logging.getLogger(__name__)


def build_relationship_agent_graph():
    """Builds and compiles the LangGraph state machine for relationship intelligence."""
    workflow = StateGraph(RelationshipAgentState)

    # 1. Add nodes
    workflow.add_node("analyze_and_retrieve", analyze_and_retrieve_node)
    workflow.add_node("generate_pause_scenarios", generate_pause_scenarios_node)
    workflow.add_node("generate_standard_qa", generate_standard_qa_node)

    # 2. Add routing logic
    workflow.set_entry_point("analyze_and_retrieve")

    workflow.add_conditional_edges(
        "analyze_and_retrieve",
        should_trigger_pause,
        {
            "pause_scenarios": "generate_pause_scenarios",
            "standard_qa": "generate_standard_qa",
        }
    )

    workflow.add_edge("generate_pause_scenarios", END)
    workflow.add_edge("generate_standard_qa", END)

    # Checkpoint store for conversation sessions
    checkpointer = MemorySaver()
    app = workflow.compile(checkpointer=checkpointer)
    return app


# Singleton compiled graph
relationship_agent_graph = build_relationship_agent_graph()
