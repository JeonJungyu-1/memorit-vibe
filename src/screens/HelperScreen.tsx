import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useTheme } from 'tamagui';
import type { HelperScreenProps } from '../navigation/types';
import { getEventDisplayText } from '../constants/eventTypes';
import {
  getCondolenceGuide,
  formatAmountRange,
  type CondolenceGuideItem,
  WEDDING_GUIDE,
  FUNERAL_GUIDE,
  GRADUATION_GUIDE,
  OTHER_EVENT_GUIDE,
} from '../constants/condolenceGuide';
import {
  getChecklistTemplate,
  CHECKLIST_EVENT_TYPES,
  type ChecklistTemplate,
} from '../constants/checklistTemplates';
import { getThemeColor, SPACING, FONT, WOBBLY_SM, HAND_DRAWN_LIGHT } from '../utils/themeColors';
import { HandDrawnButton } from '../components/HandDrawnButton';
import { HandDrawnCard } from '../components/HandDrawnCard';

type HelperTab = 'condolence' | 'checklist';

const CONDOLENCE_EVENT_OPTIONS = [
  { key: 'wedding', guide: WEDDING_GUIDE },
  { key: 'funeral', guide: FUNERAL_GUIDE },
  { key: 'graduation', guide: GRADUATION_GUIDE },
  { key: 'other', guide: OTHER_EVENT_GUIDE },
] as const;

const HelperScreen: React.FC<HelperScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<HelperTab>('condolence');
  const [condolenceEventKey, setCondolenceEventKey] = useState<string>('wedding');
  const [checklistEventKey, setChecklistEventKey] = useState<string>('wedding');

  const accent =
    getThemeColor(theme, 'red9') || getThemeColor(theme, 'red10') || '#ff4d4d';
  const color = getThemeColor(theme, 'color') || '#2d2d2d';
  const colorMuted =
    getThemeColor(theme, 'color11') || getThemeColor(theme, 'gray11') || '#666';
  const borderLight = getThemeColor(theme, 'gray4') || '#eee';
  const secondaryAccent =
    getThemeColor(theme, 'blue9') || getThemeColor(theme, 'blue10') || '#2d5da1';

  const themeStyles = useMemo(
    () => ({
      sectionTitle: { color },
      body: { color },
      muted: { color: colorMuted },
      border: { borderBottomColor: borderLight },
      tabActive: { color: accent, fontWeight: '600' as const },
      tabInactive: { color: colorMuted },
    }),
    [color, colorMuted, borderLight, accent],
  );

  const currentCondolenceGuide = useMemo(
    () => getCondolenceGuide(condolenceEventKey),
    [condolenceEventKey],
  );

  const currentChecklist = useMemo<ChecklistTemplate>(
    () => getChecklistTemplate(checklistEventKey),
    [checklistEventKey],
  );

  const backgroundColor = getThemeColor(theme, 'background') || HAND_DRAWN_LIGHT.background;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.headerRow}>
        <HandDrawnButton variant="secondary" onPress={() => navigation.goBack()}>
          ← 뒤로
        </HandDrawnButton>
        <Text style={[styles.title, { color }]}>경조사 도우미</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.tabRow, themeStyles.border]}>
        <Pressable
          style={[
            styles.tab,
            activeTab === 'condolence' && [styles.tabActive, { borderBottomColor: accent }],
          ]}
          onPress={() => setActiveTab('condolence')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'condolence' ? themeStyles.tabActive : themeStyles.tabInactive,
            ]}
          >
            축의금 참고
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.tab,
            activeTab === 'checklist' && [styles.tabActive, { borderBottomColor: accent }],
          ]}
          onPress={() => setActiveTab('checklist')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'checklist' ? themeStyles.tabActive : themeStyles.tabInactive,
            ]}
          >
            체크리스트
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'condolence' && (
          <>
            <Text style={[styles.disclaimer, themeStyles.muted]}>
              아래 금액은 참고용 일반적인 범위이며, 지역·관계에 따라 달라질 수 있습니다.
            </Text>
            <View style={styles.eventChipsRow}>
              {CONDOLENCE_EVENT_OPTIONS.map(({ key }) => (
                <Pressable
                  key={key}
                  style={[
                    styles.chip,
                    { borderColor: secondaryAccent },
                    condolenceEventKey === key && { backgroundColor: secondaryAccent },
                  ]}
                  onPress={() => setCondolenceEventKey(key)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: condolenceEventKey === key ? '#fff' : secondaryAccent },
                    ]}
                  >
                    {getEventDisplayText(key)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <HandDrawnCard style={styles.card}>
              <Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>
                관계별 참고 금액
              </Text>
              {currentCondolenceGuide.map((item: CondolenceGuideItem) => (
                <View key={item.relationship} style={[styles.guideRow, themeStyles.border]}>
                  <Text style={[styles.guideLabel, themeStyles.body]}>{item.label}</Text>
                  <Text style={[styles.guideAmount, { color: accent }]}>
                    {formatAmountRange(item.range)}
                  </Text>
                  {item.range.note ? (
                    <Text style={[styles.guideNote, themeStyles.muted]}>{item.range.note}</Text>
                  ) : null}
                </View>
              ))}
            </HandDrawnCard>
          </>
        )}

        {activeTab === 'checklist' && (
          <>
            <View style={styles.eventChipsRow}>
              {CHECKLIST_EVENT_TYPES.map(({ value, label }) => (
                <Pressable
                  key={value}
                  style={[
                    styles.chip,
                    { borderColor: secondaryAccent },
                    checklistEventKey === value && { backgroundColor: secondaryAccent },
                  ]}
                  onPress={() => setChecklistEventKey(value)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: checklistEventKey === value ? '#fff' : secondaryAccent },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <HandDrawnCard style={styles.card}>
              <Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>
                {currentChecklist.title}
              </Text>
              {currentChecklist.description ? (
                <Text style={[styles.checklistDesc, themeStyles.muted]}>
                  {currentChecklist.description}
                </Text>
              ) : null}
              {currentChecklist.items.map((item, index) => (
                <View key={item.id} style={[styles.checklistRow, themeStyles.border]}>
                  <Text style={[styles.checklistIndex, themeStyles.muted]}>
                    {index + 1}.
                  </Text>
                  <Text style={[styles.checklistText, themeStyles.body]}>{item.text}</Text>
                </View>
              ))}
            </HandDrawnCard>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.screenPadding,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.rowGap,
  },
  title: {
    flex: 1,
    fontSize: FONT.title,
    fontFamily: FONT.fontFamilyHeading,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 80,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    marginBottom: SPACING.sectionGap,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    marginBottom: -2,
  },
  tabText: {
    fontSize: FONT.body,
    fontFamily: FONT.fontFamilyBody,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.sectionGap * 2,
  },
  disclaimer: {
    fontSize: FONT.caption,
    fontFamily: FONT.fontFamilyBody,
    marginBottom: SPACING.rowGap,
  },
  eventChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.sectionGap,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 2,
    ...WOBBLY_SM,
  },
  chipText: {
    fontSize: FONT.bodySmall,
    fontFamily: FONT.fontFamilyBody,
    fontWeight: '600',
  },
  card: {
    marginBottom: SPACING.sectionGap,
  },
  sectionTitle: {
    fontSize: FONT.sectionTitle,
    fontFamily: FONT.fontFamilyHeading,
    fontWeight: '600',
    marginBottom: SPACING.rowGap,
  },
  guideRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  guideLabel: {
    fontSize: FONT.body,
    fontFamily: FONT.fontFamilyBody,
  },
  guideAmount: {
    fontSize: FONT.body,
    fontFamily: FONT.fontFamilyBody,
    fontWeight: '600',
    marginTop: 2,
  },
  guideNote: {
    fontSize: FONT.caption,
    fontFamily: FONT.fontFamilyBody,
    marginTop: 2,
  },
  checklistDesc: {
    fontSize: FONT.bodySmall,
    fontFamily: FONT.fontFamilyBody,
    marginBottom: SPACING.rowGap,
  },
  checklistRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  checklistIndex: {
    fontSize: FONT.body,
    fontFamily: FONT.fontFamilyBody,
    minWidth: 24,
  },
  checklistText: {
    flex: 1,
    fontSize: FONT.body,
    fontFamily: FONT.fontFamilyBody,
  },
});

export default HelperScreen;
