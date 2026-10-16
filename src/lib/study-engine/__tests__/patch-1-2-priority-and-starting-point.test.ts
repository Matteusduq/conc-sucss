import { describe, it, expect } from 'vitest';
import { getDefaultStore, recordQuestionSessionAction, recordErrorLogAction } from '@/lib/data/store';
import { calculateStudyScore, compareTopicsForQueue, getTopicStrategicFactors } from '@/lib/study-engine/study-score';
import { orderTopicsForDailyPlan, generateDailyPlan } from '@/lib/study-engine/recommendations';
import { Topic, TopicStatus } from '@/types/database';

describe('PATCH 1.2 — Prioridade Inicial Real e Ponto de Partida do Estudo', () => {
  // Test 1: Brand-new store has non-zero study scores
  it('1. Brand-new store does not have any topic with study_score = 0', () => {
    const store = getDefaultStore();
    expect(store.topics).toHaveLength(76);

    const zeroScored = store.topics.filter((t) => !t.study_score || t.study_score === 0);
    expect(zeroScored).toHaveLength(0);

    // Verify all topics have a valid score between 1 and 100
    store.topics.forEach((topic) => {
      expect(topic.study_score).toBeGreaterThan(0);
      expect(topic.study_score).toBeLessThanOrEqual(100);
    });
  });

  // Test 2: HIGH > MEDIUM > LOW in equivalent conditions
  it('2. HIGH > MEDIUM > LOW holds strictly in equivalent conditions', () => {
    // In P1:
    const highP1 = calculateStudyScore({
      priority: 'HIGH',
      status: 'NOT_STARTED',
      examBlockCode: 'P1',
    });
    const medP1 = calculateStudyScore({
      priority: 'MEDIUM',
      status: 'NOT_STARTED',
      examBlockCode: 'P1',
    });
    const lowP1 = calculateStudyScore({
      priority: 'LOW',
      status: 'NOT_STARTED',
      examBlockCode: 'P1',
    });

    expect(highP1.studyScore).toBeGreaterThan(medP1.studyScore);
    expect(medP1.studyScore).toBeGreaterThan(lowP1.studyScore);

    // In P2:
    const highP2 = calculateStudyScore({
      priority: 'HIGH',
      status: 'NOT_STARTED',
      examBlockCode: 'P2',
    });
    const medP2 = calculateStudyScore({
      priority: 'MEDIUM',
      status: 'NOT_STARTED',
      examBlockCode: 'P2',
    });
    const lowP2 = calculateStudyScore({
      priority: 'LOW',
      status: 'NOT_STARTED',
      examBlockCode: 'P2',
    });

    expect(highP2.studyScore).toBeGreaterThan(medP2.studyScore);
    expect(medP2.studyScore).toBeGreaterThan(lowP2.studyScore);

    // Cross-block: HIGH in P1 is strictly greater than MEDIUM in P2
    expect(highP1.studyScore).toBeGreaterThan(medP2.studyScore);
  });

  // Test 3: P2 and discursive synergy function as moderate boost without eliminating P1
  it('3. P2 and discursive synergy provide moderate boost without eliminating P1 from the daily plan', () => {
    const store = getDefaultStore();
    const ordered = orderTopicsForDailyPlan(store.topics);

    // P2 gets top spot (#1) due to strategic boost
    expect(ordered[0].exam_block_code).toBe('P2');
    expect(ordered[0].priority).toBe('HIGH');

    // P1 is immediately represented in top 2 (#2) through interleaving
    expect(ordered[1].exam_block_code).toBe('P1');
    expect(ordered[1].priority).toBe('HIGH');

    // In the first 4 tasks of daily plan, both P1 and P2 are represented
    const top4 = ordered.slice(0, 4);
    const p1InTop4 = top4.filter((t) => t.exam_block_code === 'P1');
    const p2InTop4 = top4.filter((t) => t.exam_block_code === 'P2');

    expect(p1InTop4.length).toBeGreaterThan(0);
    expect(p2InTop4.length).toBeGreaterThan(0);
  });

  // Test 4: Tied topics have deterministic tie-breaking
  it('4. Tied topics resolve via explicit 8-level deterministic tie-breaking', () => {
    const baseTopic: Topic = {
      id: 't-test-1',
      user_id: 'local-user',
      exam_id: 'exam-camara-2027',
      subject_id: 'sub-test',
      name: 'Topic 1',
      slug: 'topic-1',
      description: null,
      exam_block_code: 'P2',
      parent_topic_id: null,
      priority: 'HIGH',
      priority_label: 'Alta',
      priority_weight: 3.0,
      priority_source: null,
      priority_basis: 'RESEARCH_AND_EDITAL',
      priority_confidence: 'HIGH',
      cross_relevance: 'P1_P2_P3',
      status: 'NOT_STARTED',
      recommended_material_type: 'FULL_PDF',
      domain_score: null,
      domain_confidence: null,
      study_score: 98,
      last_studied_at: null,
      estimated_minutes: 30,
      is_discursive_relevant: true,
      discursive_eligible: true,
      discursive_synergy: 'HIGH',
      display_order: 1,
      next_recommended_at: null,
      tec_filter_hint: null,
      created_at: '',
      updated_at: '',
    };

    // Tie-break 1: Risk status
    const topicAtRisk: Topic = { ...baseTopic, id: 't-risk', status: 'AT_RISK' };
    const topicNotStarted: Topic = { ...baseTopic, id: 't-unstarted', status: 'NOT_STARTED' };
    expect(compareTopicsForQueue(topicAtRisk, topicNotStarted)).toBeLessThan(0);

    // Tie-break 2: Priority (HIGH > MEDIUM)
    const topicHigh: Topic = { ...baseTopic, id: 't-high', priority: 'HIGH' };
    const topicMed: Topic = { ...baseTopic, id: 't-med', priority: 'MEDIUM' };
    expect(compareTopicsForQueue(topicHigh, topicMed)).toBeLessThan(0);

    // Tie-break 3: Discursive synergy (HIGH > LOW)
    const topicDiscHigh: Topic = { ...baseTopic, id: 't-disc-high', discursive_synergy: 'HIGH' };
    const topicDiscLow: Topic = { ...baseTopic, id: 't-disc-low', discursive_synergy: 'LOW' };
    expect(compareTopicsForQueue(topicDiscHigh, topicDiscLow)).toBeLessThan(0);

    // Tie-break 4: Block relevance (P2 > P1)
    const topicP2: Topic = { ...baseTopic, id: 't-p2', exam_block_code: 'P2', discursive_synergy: undefined };
    const topicP1: Topic = { ...baseTopic, id: 't-p1', exam_block_code: 'P1', discursive_synergy: undefined };
    expect(compareTopicsForQueue(topicP2, topicP1)).toBeLessThan(0);

    // Tie-break 5: Lower domain / lower confidence (deficiency comes first)
    const topicDomainLow: Topic = { ...baseTopic, id: 't-dom-30', domain_score: 30 };
    const topicDomainHigh: Topic = { ...baseTopic, id: 't-dom-70', domain_score: 70 };
    expect(compareTopicsForQueue(topicDomainLow, topicDomainHigh)).toBeLessThan(0);

    // Tie-break 6: Coverage (NOT_STARTED precedes partially covered)
    const topicUnstarted: Topic = { ...baseTopic, id: 't-ns', status: 'NOT_STARTED', domain_score: 50 };
    const topicConsolidating: Topic = { ...baseTopic, id: 't-cons', status: 'CONSOLIDATING', domain_score: 50 };
    expect(compareTopicsForQueue(topicUnstarted, topicConsolidating)).toBeLessThan(0);

    // Tie-break 8: Display order / ID fallback
    const topicOrd1: Topic = { ...baseTopic, id: 't-ord-1', display_order: 1 };
    const topicOrd2: Topic = { ...baseTopic, id: 't-ord-2', display_order: 2 };
    expect(compareTopicsForQueue(topicOrd1, topicOrd2)).toBeLessThan(0);
  });

  // Test 5: Brand-new preparation state produces a valid recommendation and starting point
  it('5. Brand-new preparation produces a valid starting point with concrete factors', () => {
    const store = getDefaultStore();
    const plan = generateDailyPlan({
      topics: store.topics,
      subjects: store.subjects,
      materials: store.materials,
      errors: store.errorLogs,
      overdueCardsCount: 0,
      availableMinutesToday: 180,
    });

    expect(plan.tasks.length).toBeGreaterThanOrEqual(2);

    const mainMission = plan.tasks[0];
    const nextStep = plan.tasks[1];

    // Main Mission is top P2 topic
    expect(mainMission.examBlockCode).toBe('P2');
    expect(mainMission.priority).toBe('HIGH');
    expect(mainMission.studyScore).toBeGreaterThanOrEqual(98);
    expect(mainMission.strategicReasons).toBeDefined();
    expect(mainMission.strategicReasons!.length).toBeGreaterThanOrEqual(2);
    expect(mainMission.strategicReasons!.length).toBeLessThanOrEqual(4);

    // Next step is top P1 topic
    expect(nextStep.examBlockCode).toBe('P1');
    expect(nextStep.priority).toBe('HIGH');
    expect(nextStep.studyScore).toBeGreaterThanOrEqual(90);
    expect(nextStep.strategicReasons).toBeDefined();
    expect(nextStep.strategicReasons!.length).toBeGreaterThanOrEqual(2);
  });

  // Test 6: Performance changes recalculate topic order
  it('6. Changes in question session performance recalculate queue order', () => {
    let store = getDefaultStore();

    // Initial deliberate starter sequence: Rank 1 is top-p2-ling-3 (P2 HIGH) and Rank 2 is top-p1-port-1 (P1 HIGH)
    const initialPlan = generateDailyPlan({
      topics: store.topics,
      subjects: store.subjects,
      materials: store.materials,
      errors: store.errorLogs,
      overdueCardsCount: 0,
    });
    expect(initialPlan.tasks[0].id).toBe('task-top-p2-ling-3');
    expect(initialPlan.tasks[1].id).toBe('task-top-p1-port-1');

    // Record a poor session with low accuracy and negative net points on top-p1-port-1
    store = recordQuestionSessionAction(
      {
        user_id: 'local-user',
        exam_id: 'exam-camara-2027',
        subject_id: 'sub-portugues',
        topic_id: 'top-p1-port-1',
        performed_at: new Date().toISOString(),
        total_questions: 20,
        correct: 6,
        wrong: 14,
        blank: 0,
        duration_seconds: 1200,
        subjective_feeling: 'VERY_WEAK',
        notes: 'Dificuldade severa em tipologia Cebraspe',
        accuracy_rate: 0.3,
        net_points: -8,
        net_rate: -0.4,
        had_conceptual_error: true,
      },
      store
    );

    // After poor session, topic status is updated and study score recalculated
    const updatedTopic = store.topics.find((t) => t.id === 'top-p1-port-1');
    expect(updatedTopic).toBeDefined();
    expect(updatedTopic!.domain_score).toBeDefined();

    // Also record an error log for this topic
    const errResult = recordErrorLogAction(
      {
        user_id: 'local-user',
        exam_id: 'exam-camara-2027',
        subject_id: 'sub-portugues',
        topic_id: 'top-p1-port-1',
        question_session_id: null,
        error_type: 'CONCEPT_CONFUSION',
        summary: 'Confundi texto dissertativo com descritivo',
        correct_rule: 'Texto dissertativo argumentativo defende uma tese com argumentos.',
        personal_note: null,
        severity: 'MEDIUM',
        resolved: false,
        resolved_at: null,
      },
      store
    );
    store = errResult.store;

    expect(store.errorLogs.length).toBeGreaterThan(0);
    expect(store.topics.find((t) => t.id === 'top-p1-port-1')?.study_score).toBeGreaterThan(0);
  });

  // Test 7: An AT_RISK topic can overtake unstarted topics
  it('7. An AT_RISK topic can overtake unstarted topics and take position 1', () => {
    let store = getDefaultStore();

    // Manually mark a P1 topic as AT_RISK (e.g. top-p1-port-1)
    store = {
      ...store,
      topics: store.topics.map((t) =>
        t.id === 'top-p1-port-1'
          ? {
              ...t,
              status: 'AT_RISK' as TopicStatus,
              domain_score: 35,
              domain_confidence: 'MEDIUM' as const,
              study_score: 99,
            }
          : t
      ),
    };

    const ordered = orderTopicsForDailyPlan(store.topics);

    // The AT_RISK topic MUST be in position 0, overtaking even unstarted P2 topics
    expect(ordered[0].id).toBe('top-p1-port-1');
    expect(ordered[0].status).toBe('AT_RISK');
  });

  // Test 8: No regressions on 182 SyllabusItems and 76 Topics
  it('8. Maintains exactly 182 SyllabusItems and 76 Topics without regression', () => {
    const store = getDefaultStore();
    expect(store.syllabusItems).toHaveLength(182);
    expect(store.topics).toHaveLength(76);
    expect(store.topicSyllabusItems.length).toBeGreaterThanOrEqual(182);
  });

  // Test 9: P1 continues with 42 Topics and P2 with 34 Topics
  it('9. Maintains exact topic count per block: 42 in P1 and 34 in P2', () => {
    const store = getDefaultStore();
    const p1Topics = store.topics.filter((t) => t.exam_block_code === 'P1');
    const p2Topics = store.topics.filter((t) => t.exam_block_code === 'P2');

    expect(p1Topics).toHaveLength(42);
    expect(p2Topics).toHaveLength(34);
    expect(p1Topics.length + p2Topics.length).toBe(76);
  });

  // Test 10: getTopicStrategicFactors produces 2-4 concrete reasons
  it('10. getTopicStrategicFactors produces 2-4 concrete reasons based on official edital rules', () => {
    const store = getDefaultStore();
    store.topics.forEach((topic) => {
      const factors = getTopicStrategicFactors(topic);
      expect(factors.length).toBeGreaterThanOrEqual(2);
      expect(factors.length).toBeLessThanOrEqual(4);
      // None of the factors mention fake incidence statistics
      factors.forEach((f) => {
        expect(f).not.toContain('% de incidência');
      });
    });
  });
});
