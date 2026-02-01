import React, { useState, useCallback, useRef } from 'react';
import { AgentRole, AppState, PlanStep, Artifact, LogMessage } from './types';
import * as geminiService from './services/geminiService';
import DashboardView from './views/DashboardView';
import WorkflowPlannerView from './views/WorkflowPlannerView';
import DataScoutView from './views/DataScoutView';
import DevOpsView from './views/DevOpsView';
import InsightsView from './views/InsightsView';
import ProcessingOverlay from './components/ProcessingOverlay';

type ViewMode = 'DASHBOARD' | 'PLANNING' | 'DATA' | 'DEVOPS' | 'REPORT';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    isProcessing: false,
    currentStepId: null,
    logs: [],
    plan: [],
    artifacts: [],
  });
  
  const [viewMode, setViewMode] = useState<ViewMode>('DASHBOARD');
  const [executionOutput, setExecutionOutput] = useState<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const addLog = (role: 'user' | 'agent' | 'system', content: string, agentRole?: AgentRole) => {
    setState(prev => ({
      ...prev,
      logs: [...prev.logs, {
        id: Math.random().toString(36).substr(2, 9),
        role,
        content,
        agentRole,
        timestamp: Date.now()
      }]
    }));
  };

  const addArtifact = (type: Artifact['type'], title: string, content: string) => {
    setState(prev => ({
      ...prev,
      artifacts: [...prev.artifacts, { type, title, content }]
    }));
  };

  const updatePlanStepStatus = (stepId: string, status: PlanStep['status']) => {
    setState(prev => ({
      ...prev,
      plan: prev.plan.map(p => p.id === stepId ? { ...p, status } : p)
    }));
  };

  const handleStopWorkflow = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      addLog('system', 'Workflow stopped by user.');
      setState(prev => ({ ...prev, isProcessing: false, currentStepId: null }));
    }
  };

  const executeStep = async (step: PlanStep, accumulatedContext: string): Promise<string> => {
    await new Promise(r => setTimeout(r, 1000));

    let result = "";
    try {
      switch (step.assignedAgent) {
        case AgentRole.DATA_GATHERER:
          addLog('system', "Executing ArXiv search script...", AgentRole.DATA_GATHERER);
          const dataResult = await geminiService.executeDataGathering(step.description);
          
          if (dataResult.isGeneric) {
             addLog('system', "Warning: ArXiv search failed or returned no results. Using fallback.", AgentRole.DATA_GATHERER);
          }
          
          addArtifact('code', 'ArXiv Search Script', dataResult.code);
          addArtifact('data', 'Research Data', dataResult.output);
          result = dataResult.output;
          break;

        case AgentRole.ENV_SETUP:
          result = await geminiService.executeEnvSetup(step.description, accumulatedContext);
          addArtifact('env', 'Environment Config', result);
          break;

        case AgentRole.CODE_GENERATOR:
          addLog('system', "Generating and executing analysis code...", AgentRole.CODE_GENERATOR);
          const codeResult = await geminiService.executeCodeGeneration(step.description, accumulatedContext);
          
          addArtifact('code', 'Analysis Script', codeResult.code);
          setExecutionOutput(codeResult.output); // Save for analyzer
          result = `Code Generated and Executed.\nOutput Preview:\n${codeResult.output.substring(0, 200)}...`;
          break;

        case AgentRole.RESULT_ANALYZER:
          const contextToUse = executionOutput 
            ? `Actual Execution Output:\n${executionOutput}` 
            : `Code has been generated but execution output is missing. Analyze logic only.`;

          result = await geminiService.executeAnalysis(step.description, contextToUse + "\n\n" + accumulatedContext);
          addArtifact('analysis', 'Analysis Insights', result);
          break;

        case AgentRole.DOCUMENTATION:
          result = await geminiService.executeDocumentation(step.description, accumulatedContext);
          addArtifact('doc', 'Final Report', result);
          break;

        default:
          result = "Task completed.";
      }
      
      addLog('agent', result, step.assignedAgent);
      return result;
    } catch (error: any) {
      console.error(error);
      addLog('system', `Error executing step: ${error.message}`);
      return "Error: " + error.message;
    }
  };

  const runWorkflow = async (plan: PlanStep[], userPrompt: string) => {
      setViewMode('DASHBOARD');
      setState(prev => ({ ...prev, isProcessing: true }));

      let context = `Original Goal: ${userPrompt}\n\n`;
      const signal = abortControllerRef.current?.signal;
      
      for (const step of plan) {
        if (signal?.aborted) {
           addLog('system', 'Workflow execution aborted.');
           return;
        }

        setState(prev => ({ ...prev, currentStepId: step.id }));
        updatePlanStepStatus(step.id, 'running');
        
        const stepResult = await executeStep(step, context);
        
        // Check abort again after step completion
        if (signal?.aborted) {
            updatePlanStepStatus(step.id, 'failed');
            return;
        }

        context += `\n\n--- Output from ${step.assignedAgent} ---\n${stepResult}`;
        updatePlanStepStatus(step.id, 'completed');
      }

      addLog('agent', "All tasks completed successfully. Protocol finished.", AgentRole.MANAGER);
      setState(prev => ({ ...prev, isProcessing: false, currentStepId: null }));
  };

  const handleStartWorkflow = useCallback(async (userPrompt: string) => {
    // Reset state
    setState(prev => ({ ...prev, isProcessing: true, logs: [], plan: [], artifacts: [], currentStepId: null })); 
    setExecutionOutput(""); 
    addLog('user', userPrompt);
    
    // Initialize AbortController
    abortControllerRef.current = new AbortController();

    // Show planning view briefly
    setViewMode('PLANNING'); 

    try {
      const plan = await geminiService.generatePlan(userPrompt);
      
      if (abortControllerRef.current.signal.aborted) return;

      setState(prev => ({ ...prev, plan })); 
      
      // Auto-start execution
      await runWorkflow(plan, userPrompt);

    } catch (error: any) {
      addLog('system', `Workflow failed: ${error.message}`);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, []);

  const handleExecutionComplete = (output: string) => {
    setExecutionOutput(output);
  };

  const activeStep = state.plan.find(p => p.id === state.currentStepId);

  return (
    <>
      <ProcessingOverlay 
        isVisible={state.isProcessing && viewMode === 'DASHBOARD'} 
        currentStep={activeStep} 
        logs={state.logs} 
        onStop={handleStopWorkflow}
      />

      {viewMode === 'DASHBOARD' && (
        <DashboardView 
          onStartWorkflow={handleStartWorkflow} 
          isProcessing={state.isProcessing}
          artifacts={state.artifacts}
          onViewDetails={(mode) => setViewMode(mode)}
          executionOutput={executionOutput}
        />
      )}
      
      {viewMode === 'PLANNING' && (
        <WorkflowPlannerView 
          plan={state.plan} 
          logs={state.logs}
          currentStepId={state.currentStepId} 
          isProcessing={state.isProcessing}
          onStop={handleStopWorkflow}
        />
      )}

      {viewMode === 'DATA' && (
        <DataScoutView 
          logs={state.logs} 
          artifacts={state.artifacts} 
          isProcessing={state.isProcessing}
          onBack={() => setViewMode('DASHBOARD')}
        />
      )}

      {viewMode === 'DEVOPS' && (
        <DevOpsView 
          artifacts={state.artifacts} 
          isProcessing={state.isProcessing}
          onBack={() => setViewMode('DASHBOARD')}
          onExecutionComplete={handleExecutionComplete}
          externalOutput={executionOutput}
        />
      )}

      {viewMode === 'REPORT' && (
        <InsightsView 
          artifacts={state.artifacts} 
          onBack={() => setViewMode('DASHBOARD')}
        />
      )}
    </>
  );
};

export default App;