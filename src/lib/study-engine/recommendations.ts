import { Topic, Subject, StudyMaterial, ErrorLog, Priority } from '@/types/database';
import { TodayTask, TodayPlanSummary } from '@/types/study';
import { compareTopicsForQueue, getTopicStrategicFactors } from './study-score';

export interface PlannerContext {
  topics: Topic[];
  subjects: Subject[];
  materials: StudyMaterial[];
  errors: ErrorLog[];
  overdueCardsCount: number;
  availableMinutesToday?: number;
  weeklyTargetMinutes?: number;
}

/**
 * Orders topics for the daily study plan using strategic exam weighting,
 * risk priorities, and interleaved block balance (P2 and P1).
 *
 * Rules:
 * 1. Urgent topics (AT_RISK, AWAITING_QUESTIONS) are placed first, ordered by compareTopicsForQueue.
 * 2. Regular topics respect priority tiers (HIGH > MEDIUM > LOW).
 * 3. Within each priority tier, P2 and P1 are interleaved so that P2 gets the top recommendation
 *    (due to its strategic score boost) while P1 is never excluded or starved from daily study.
 * 4. Deterministic tie-breaking via compareTopicsForQueue ensures no reliance on raw seed array order.
 */
export function orderTopicsForDailyPlan(topics: Topic[]): Topic[] {
  // 1. Critical urgency / risk topics take absolute precedence
  const urgent = topics
    .filter((t) => t.status === 'AT_RISK' || t.status === 'AWAITING_QUESTIONS')
    .sort(compareTopicsForQueue);

  // 2. Non-urgent topics grouped by priority tier (HIGH > MEDIUM > LOW)
  const nonUrgent = topics.filter(
    (t) => t.status !== 'AT_RISK' && t.status !== 'AWAITING_QUESTIONS'
  );

  const tiers: Priority[] = ['HIGH', 'MEDIUM', 'LOW'];
  const orderedNonUrgent: Topic[] = [];

  for (const prio of tiers) {
    const tierTopics = nonUrgent.filter((t) => t.priority === prio);
    const p2Tier = tierTopics
      .filter((t) => t.exam_block_code === 'P2')
      .sort(compareTopicsForQueue);
    const p1Tier = tierTopics
      .filter((t) => t.exam_block_code === 'P1')
      .sort(compareTopicsForQueue);
    const otherTier = tierTopics
      .filter((t) => t.exam_block_code !== 'P1' && t.exam_block_code !== 'P2')
      .sort(compareTopicsForQueue);

    // Interleave P2 and P1 within this tier. P2 leads because of its strategic advantage.
    const maxLen = Math.max(p2Tier.length, p1Tier.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < p2Tier.length) orderedNonUrgent.push(p2Tier[i]);
      if (i < p1Tier.length) orderedNonUrgent.push(p1Tier[i]);
    }
    orderedNonUrgent.push(...otherTier);
  }

  return [...urgent, ...orderedNonUrgent];
}

export function generateDailyPlan(context: PlannerContext): TodayPlanSummary {
  const {
    topics,
    subjects,
    materials,
    errors,
    overdueCardsCount,
    availableMinutesToday,
    weeklyTargetMinutes = 1080,
  } = context;

  // Derive available minutes from settings or weekly target (1080 / 6 days ~ 180 min/day default)
  const availableMinutes =
    availableMinutesToday && availableMinutesToday > 0
      ? availableMinutesToday
      : Math.round(weeklyTargetMinutes / 6);

  // Suggested daily distribution:
  // Default: 45% theory/material, 30% TEC questions, 20% memory, 5% buffer
  let memoryMinutes = Math.min(30, Math.round(availableMinutes * 0.20));
  if (overdueCardsCount > 15) {
    memoryMinutes = Math.min(35, Math.round(availableMinutes * 0.25));
  }
  if (overdueCardsCount === 0) {
    memoryMinutes = Math.min(15, Math.round(availableMinutes * 0.10));
  }

  const remainingAfterMemory = availableMinutes - memoryMinutes;
  const bufferMinutes = Math.max(5, Math.round(availableMinutes * 0.05));
  const coreMinutes = remainingAfterMemory - bufferMinutes;

  // Subject lookup
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
  const materialByTopic = new Map(materials.map((m) => [m.topic_id, m]));

  // Rank topics strategically with deterministic tie-breaking and block balancing
  const sortedTopics = orderTopicsForDailyPlan(topics);

  const tasks: TodayTask[] = [];
  const alerts: string[] = [];
  let allocatedMinutes = memoryMinutes;

  // 1. Check for AT_RISK or High priority alert
  const criticalTopics = sortedTopics.filter(
    (t) => t.status === 'AT_RISK' || (t.priority === 'HIGH' && (t.domain_score ?? 0) < 50 && t.status !== 'NOT_STARTED')
  );

  criticalTopics.slice(0, 3).forEach((t) => {
    const blockLabel = t.exam_block_code ? `[${t.exam_block_code}] ` : '';
    alerts.push(
      `Alerta de Risco: ${blockLabel}"${t.name}" (${subjectMap.get(t.subject_id) ?? 'Geral'}) exige atenção imediata devido ao baixo domínio.`
    );
  });

  // Check for Awaiting Questions alert
  const awaitingQuestions = sortedTopics.filter((t) => t.status === 'AWAITING_QUESTIONS');
  if (awaitingQuestions.length > 0) {
    const firstAwaiting = awaitingQuestions[0];
    alerts.push(
      `Você concluiu o material de "${firstAwaiting.name}", mas ainda não registrou questões no TEC.`
    );
  }

  // 2. Build tasks based on status and study_score
  for (const topic of sortedTopics) {
    if (allocatedMinutes >= availableMinutes - bufferMinutes) break;

    const subjectName = subjectMap.get(topic.subject_id) ?? 'Geral';
    const material = materialByTopic.get(topic.id);
    const hasMaterialFile = material && material.status === 'AVAILABLE';

    // Errors for this topic
    const topicErrors = errors.filter((e) => e.topic_id === topic.id && !e.resolved);

    let actionType: TodayTask['actionType'] = 'TEC_QUESTIONS';
    let actionLabel = 'Resolver questões no TEC';
    let reason = '';
    const estimated = topic.estimated_minutes ?? 30;

    if (topic.status === 'AT_RISK') {
      actionType = 'REVIEW_ERRORS';
      actionLabel = 'Revisar erros e pontos críticos';
      reason = `Tópico em risco com domínio em ${topic.domain_score ?? 0}%. Alta prioridade para a prova Cebraspe.`;
    } else if (topic.status === 'AWAITING_QUESTIONS') {
      actionType = 'TEC_QUESTIONS';
      actionLabel = 'Fazer bateria no TEC Concursos';
      reason = `Teoria finalizada! O próximo passo obrigatório é consolidar o conteúdo com questões da banca.`;
    } else if (topic.status === 'NOT_STARTED' || topic.status === 'LEARNING') {
      if (hasMaterialFile) {
        actionType = 'READ_MATERIAL';
        actionLabel = topic.status === 'NOT_STARTED' ? 'Iniciar leitura do material' : 'Continuar leitura';
        reason = `Conteúdo ${topic.priority === 'HIGH' ? 'de altíssima relevância no edital' : 'previsto no edital'}.`;
      } else {
        actionType = 'TEC_QUESTIONS';
        actionLabel = 'Praticar no TEC Concursos';
        reason = `Material PDF aguardando upload. Recomendado iniciar contato prévio via questões filtradas no TEC.`;
      }
    } else if (topic.status === 'CONSOLIDATING') {
      actionType = 'TEC_QUESTIONS';
      actionLabel = 'Bateria de consolidação no TEC';
      reason = `Fase de consolidação. Domínio atual em ${topic.domain_score ?? 0}%. Meta: atingir 85% para domínio pleno.`;
    } else {
      // MASTERED / MAINTENANCE
      actionType = 'TEC_QUESTIONS';
      actionLabel = 'Manutenção preventiva no TEC';
      reason = `Tópico com bom domínio. Sessão rápida de manutenção para prevenir decaimento da retenção.`;
    }

    if (topicErrors.length >= 2) {
      reason += ` (${topicErrors.length} erros cadastrados neste tópico).`;
    }

    tasks.push({
      id: `task-${topic.id}`,
      topicId: topic.id,
      subjectId: topic.subject_id,
      subjectName,
      topicName: topic.name,
      examBlockCode: topic.exam_block_code,
      priority: topic.priority,
      recommendedMaterialType: topic.recommended_material_type,
      actionType,
      actionLabel,
      reason,
      estimatedMinutes: estimated,
      studyScore: topic.study_score,
      domainScore: topic.domain_score,
      domainConfidence: topic.domain_confidence,
      crossRelevance: topic.cross_relevance,
      isDiscursiveRelevant: topic.is_discursive_relevant,
      targetQuestions: topic.priority === 'HIGH' ? 30 : topic.priority === 'MEDIUM' ? 20 : 15,
      strategicReasons: getTopicStrategicFactors(topic),
      discursiveSynergy: topic.discursive_synergy,
    });

    allocatedMinutes += estimated;
  }

  const theoryMinutes = tasks
    .filter((t) => t.actionType === 'READ_MATERIAL')
    .reduce((sum, t) => sum + t.estimatedMinutes, 0);

  const questionsMinutes = tasks
    .filter((t) => t.actionType === 'TEC_QUESTIONS' || t.actionType === 'REVIEW_ERRORS')
    .reduce((sum, t) => sum + t.estimatedMinutes, 0);

  return {
    availableMinutes,
    blocks: {
      theoryMinutes: Math.min(coreMinutes, theoryMinutes || Math.round(coreMinutes * 0.6)),
      questionsMinutes: Math.min(coreMinutes, questionsMinutes || Math.round(coreMinutes * 0.4)),
      memoryMinutes,
      bufferMinutes,
    },
    tasks,
    reviewsDueCount: overdueCardsCount,
    reviewsDueMinutes: Math.min(memoryMinutes, Math.ceil(overdueCardsCount * 0.8)),
    alerts,
  };
}

export function generateDeterministicInsights(params: {
  topics: Topic[];
  errors: ErrorLog[];
  desiredRetention?: number;
}): string[] {
  const { topics, errors } = params;
  const insights: string[] = [];

  // Insight 1: HIGH and domain_score < 60
  const highLowDomain = topics.filter(
    (t) => t.priority === 'HIGH' && (t.domain_score ?? 0) < 60 && t.status !== 'NOT_STARTED'
  );
  if (highLowDomain.length > 0) {
    const t = highLowDomain[0];
    const prefix = t.exam_block_code ? `[${t.exam_block_code}] ` : '';
    insights.push(
      `Tópico crítico: ${prefix}"${t.name}" é prioritário para a prova e seu domínio ainda está baixo (${t.domain_score ?? 0}%).`
    );
  }

  // Insight 2: Material completed and no question session
  const awaitingQuestions = topics.filter((t) => t.status === 'AWAITING_QUESTIONS');
  if (awaitingQuestions.length > 0) {
    insights.push(
      `Você concluiu a teoria de "${awaitingQuestions[0].name}", mas ainda não testou o conteúdo em questões no TEC Concursos.`
    );
  }

  // Insight 3: Topic AT_RISK
  const atRisk = topics.filter((t) => t.status === 'AT_RISK');
  if (atRisk.length > 0) {
    insights.push(
      `Atenção: "${atRisk[0].name}" sofreu queda recente relevante de rendimento e voltou para o topo das prioridades.`
    );
  }

  // Insight 4: Recurrent CONCEPT_CONFUSION
  const errorsByTopic: Record<string, number> = {};
  errors
    .filter((e) => e.error_type === 'CONCEPT_CONFUSION')
    .forEach((e) => {
      errorsByTopic[e.topic_id] = (errorsByTopic[e.topic_id] || 0) + 1;
    });

  for (const [topicId, count] of Object.entries(errorsByTopic)) {
    if (count >= 3) {
      const topic = topics.find((t) => t.id === topicId);
      if (topic) {
        insights.push(
          `Padrão de erro identificado: Há ${count} ocorrências de confusão entre conceitos no tópico "${topic.name}". Recomendado gerar flashcards de comparação.`
        );
        break;
      }
    }
  }

  return insights;
}
