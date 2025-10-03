"use client";

import React from "react";

import { SessionSkeleton } from "@/components/ui/loading";
import { Toast } from "@/components/ui/toast";
import { HistoryModal } from "@/components/modals/HistoryModal";
import { FeedbackModal } from "@/components/modals/FeedbackModal";
import { SessionManagement } from "@/components/sections/SessionManagement";
import { SessionStats } from "@/components/sections/SessionStats";
import { ProblemGenerator } from "@/components/sections/ProblemGenerator";
import { ProblemDisplay } from "@/components/sections/ProblemDisplay";
import { Header } from "@/components/sections/Header";

import { useSession } from "@/lib/hooks/useSession";
import { useTopics } from "@/lib/hooks/useTopics";
import { useToast } from "@/lib/hooks/useToast";
import { useHistory } from "@/lib/hooks/useHistory";
import { useProblem } from "@/lib/hooks/useProblem";

export default function Home() {
// Use custom hooks
const session = useSession();
const topics = useTopics();
const toast = useToast();
const history = useHistory();
const problem = useProblem(session.currentSessionId, topics.topicMapping);

// Inject functions into hooks
session.setShowToast(toast.showToastNotification);
session.setResetProblemState(problem.resetProblemState);
topics.setShowToast(toast.showToastNotification);
history.setShowToast(toast.showToastNotification);
problem.setShowToast(toast.showToastNotification);
problem.setRefreshSessionData(session.refreshSessionData);

  // Disable body scroll when modal is open
  React.useEffect(() => {
    if (history.isHistoryOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [history.isHistoryOpen]);

  // Wrapper functions for components
  const handleGenerateProblem = () => problem.generateProblem(topics.topics);
  const handleOpenHistoryModal = () => history.openHistoryModal(session.currentSessionId || undefined);

  return (
    <>
      <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto bg-gradient-radial from-indigo-900/20 via-purple-900/20 to-black bg-black">
        <Header />

        {session.isInitialLoading && !session.currentSessionId ? (
          <SessionSkeleton />
        ) : (
          <SessionManagement
            currentSessionId={session.currentSessionId}
            isCreatingLoading={session.isCreatingSession}
            isJoiningLoading={session.isJoiningSession}
            isInitialLoading={session.isInitialLoading}
            joinSessionId={session.joinSessionId}
            setJoinSessionId={session.setJoinSessionId}
            createNewSession={session.createNewSession}
            endSession={session.endSession}
            joinSession={session.joinSession}
            showToast={toast.showToastNotification}
          />
        )}

        <SessionStats sessionData={session.sessionData} onOpenHistory={handleOpenHistoryModal} />

        {session.currentSessionId &&
          !(
            (session.isInitialLoading && !session.currentSessionId) ||
            session.isCreatingSession ||
            session.isJoiningSession
          ) && (
            <ProblemGenerator
              selectedDifficulty={problem.selectedDifficulty}
              setSelectedDifficulty={problem.setSelectedDifficulty}
              selectedProblemType={problem.selectedProblemType}
              setSelectedProblemType={problem.setSelectedProblemType}
              selectedTopic={problem.selectedTopic}
              setSelectedTopic={problem.setSelectedTopic}
              topics={topics.getFilteredTopics(topics.topics)}
              topicMapping={topics.topicMapping}
              generateProblem={handleGenerateProblem}
              isGenerating={problem.isGenerating}
            />
          )}

        {!(
          (session.isInitialLoading && !session.currentSessionId) ||
          session.isCreatingSession ||
          session.isJoiningSession
        ) && (
          <ProblemDisplay
            problem={problem.problem}
            topic={problem.topic}
            currentProblemDifficulty={problem.currentProblemDifficulty}
            currentProblemType={problem.currentProblemType}
            userAnswer={problem.userAnswer}
            setUserAnswer={problem.setUserAnswer}
            submitAnswer={problem.submitAnswer}
            isSubmitting={problem.isSubmitting}
            isGenerating={problem.isGenerating}
            hint={problem.hint}
            showHint={problem.showHint}
            isLoadingHint={problem.isLoadingHint}
            getHint={problem.getHint}
            hintCredits={session.sessionData?.hint_credits || 0}
          />
        )}

        <HistoryModal
          isOpen={history.isHistoryOpen}
          onClose={history.closeHistoryModal}
          historyData={history.historyData}
          currentHistoryPage={history.currentHistoryPage}
          totalHistoryPages={history.totalHistoryPages}
          isLoadingHistory={history.isLoadingHistory}
          onFetchHistory={history.fetchHistory}
          topicMapping={topics.topicMapping}
        />

        <FeedbackModal
          isOpen={problem.isFeedbackModalOpen}
          onClose={() => problem.setIsFeedbackModalOpen(false)}
          isCorrect={problem.isCorrect}
          feedback={problem.feedback}
          isLoading={problem.feedbackModalLoading}
        />

        {/* Toast Notification */}
        <Toast message={toast.toastMessage || ""} type={toast.toastType} show={toast.showToast} />
      </div>
    </>
  );
}
