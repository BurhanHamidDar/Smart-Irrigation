import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  StatusBar,
} from 'react-native';
import {
  Droplets,
  Thermometer,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  Leaf,
  Zap,
  Flame,
  CloudSnow,
  Flower,
  Sprout,
  Activity,
  Layers,
} from 'lucide-react-native';

// ─── Data ───────────────────────────────────────────────────────────────────

const SEASONS = [
  {
    id: 'dormant',
    name: 'Dormant / Winter Rest',
    months: 'Nov – Feb',
    icon: (color) => <CloudSnow size={20} color={color} />,
    color: '#3b82f6', // Bright Blue
    bg: 'rgba(59,130,246,0.08)',
    targetMoisture: '30 – 40%',
    rawRange: '540 – 660 (mid-high)',
    frequency: 'None / minimal',
    notes:
      'Trees are dormant. Irrigate only if there is an extended dry spell with no snowfall. Excessive watering promotes root rot.',
  },
  {
    id: 'budbreak',
    name: 'Bud Break & Bloom',
    months: 'Mar – Apr',
    icon: (color) => <Flower size={20} color={color} />,
    color: '#ec4899', // Pink
    bg: 'rgba(236,72,153,0.08)',
    targetMoisture: '50 – 65%',
    rawRange: '405 – 510 (low-mid)',
    frequency: 'Every 5 – 7 days',
    notes:
      'Critical period. Water stress during bloom significantly reduces fruit set. Maintain consistent moisture but avoid waterlogging, which can cause flower drop.',
  },
  {
    id: 'fruitset',
    name: 'Fruit Set & Cell Division',
    months: 'May – Jun',
    icon: (color) => <Sprout size={20} color={color} />,
    color: '#10b981', // Green
    bg: 'rgba(16,185,129,0.08)',
    targetMoisture: '60 – 75%',
    rawRange: '375 – 480 (low)',
    frequency: 'Every 4 – 6 days',
    notes:
      'High water demand. Cell division determines final fruit size. Deficit irrigation at this stage causes premature fruit drop and permanently smaller apples.',
  },
  {
    id: 'development',
    name: 'Fruit Development',
    months: 'Jul – Aug',
    icon: (color) => <Activity size={20} color={color} />,
    color: '#84cc16', // Lime Green
    bg: 'rgba(132,204,22,0.08)',
    targetMoisture: '65 – 75%',
    rawRange: '375 – 450 (low)',
    frequency: 'Every 3 – 5 days',
    notes:
      'Peak demand. Hot dry summers in Kashmir make this period critical for high-density orchards. Drip or micro-sprinkler is preferred over flood irrigation.',
  },
  {
    id: 'maturation',
    name: 'Maturation & Harvest',
    months: 'Sep – Oct',
    icon: (color) => <Layers size={20} color={color} />,
    color: '#f43f5e', // Rose
    bg: 'rgba(244,63,94,0.08)',
    targetMoisture: '45 – 60%',
    rawRange: '480 – 555 (mid)',
    frequency: 'Every 7 – 10 days',
    notes:
      'Gradually reduce irrigation 2–3 weeks before harvest to concentrate sugars and improve colour. Excess water at this stage dilutes Brix and causes storage problems.',
  },
];

const HDAO_TIPS = [
  {
    icon: <Droplets size={18} color="#3b82f6" />,
    tip: 'High-density plantations (M9, M26 rootstocks) have shallow roots — water demand is 30–40% higher than traditional orchards of the same area.',
  },
  {
    icon: <Zap size={18} color="#f59e0b" />,
    tip: 'Drip irrigation at 2–4 L/tree/hour is most efficient. Avoid flood irrigation; it leaches nutrients and compacts the soil in high-density rows.',
  },
  {
    icon: <Leaf size={18} color="#10b981" />,
    tip: 'Target soil matric potential of –20 to –50 kPa in the active root zone (top 30–40 cm) during growing season.',
  },
  {
    icon: <AlertTriangle size={18} color="#ef4444" />,
    tip: 'Wilting symptoms in apple appear when soil moisture falls below 20%. By that point irreversible stress has already occurred — start irrigation at 35%.',
  },
  {
    icon: <CheckCircle2 size={18} color="#22c55e" />,
    tip: 'Kashmir valley temperatures drop rapidly in autumn. Cease heavy irrigation by mid-October to harden the trees before the first frost.',
  },
  {
    icon: <Thermometer size={18} color="#a78bfa" />,
    tip: 'On hot days (>30°C), which can occur in July–August in lower-elevation orchards, increase irrigation frequency even if the moisture sensor reads "adequate".',
  },
  {
    icon: <Calendar size={18} color="#fb923c" />,
    tip: 'Schedule irrigation in early morning (4–8 AM) to minimise evaporation loss, especially during the dry summer months.',
  },
];

const SENSOR_GUIDE = [
  { range: '75 – 100 %', raw: '< 420', label: 'Saturated', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', advice: 'Do NOT irrigate. Risk of root suffocation and fungal disease.' },
  { range: '60 – 75 %', raw: '420 – 480', label: 'Well Moistened', color: '#10b981', bg: 'rgba(16,185,129,0.08)', advice: 'Ideal for fruit development (May–Aug). Monitor daily.' },
  { range: '40 – 60 %', raw: '480 – 540', label: 'Adequate', color: '#22c55e', bg: 'rgba(34,197,94,0.08)', advice: 'Good for most growth stages. Irrigate within 2 days.' },
  { range: '20 – 40 %', raw: '540 – 660', label: 'Low Moisture', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', advice: 'Irrigate today. Trees may begin to experience stress.' },
  { range: '0 – 20 %', raw: '> 660', label: 'Critical Dry', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', advice: 'Emergency irrigation required. Risk of fruit drop and tree damage.' },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function SeasonCard({ season, theme }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <TouchableOpacity
      style={[styles.seasonCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.85}
    >
      <View style={styles.seasonHeader}>
        <View style={[styles.seasonIconBox, { backgroundColor: season.bg }]}>
          {season.icon(season.color)}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.seasonName, { color: theme.text }]}>{season.name}</Text>
          <Text style={[styles.seasonMonths, { color: theme.sub }]}>{season.months}</Text>
        </View>
        {expanded
          ? <ChevronUp size={18} color={theme.sub} />
          : <ChevronDown size={18} color={theme.sub} />}
      </View>
      {expanded && (
        <View style={styles.seasonDetails}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.sub }]}>Target Moisture</Text>
            <Text style={[styles.detailValue, { color: season.color }]}>{season.targetMoisture}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.sub }]}>Raw Sensor Range</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{season.rawRange}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.sub }]}>Irrigation Freq.</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{season.frequency}</Text>
          </View>
          <View style={[styles.noteBox, { backgroundColor: season.bg }]}>
            <Text style={[styles.noteText, { color: theme.text }]}>{season.notes}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

function SensorRow({ item, theme }) {
  return (
    <View style={[styles.sensorRow, { borderColor: theme.border, backgroundColor: theme.card }]}>
      <View style={styles.sensorRowHeader}>
        <View style={[styles.statusBadge, { backgroundColor: item.bg, borderColor: item.color }]}>
          <Text style={[styles.statusLabelText, { color: item.color }]}>{item.label}</Text>
        </View>
        <Text style={[styles.sensorRange, { color: theme.text }]}>{item.range}</Text>
        <Text style={[styles.sensorRaw, { color: theme.sub }]}>Raw: {item.raw}</Text>
      </View>
      <Text style={[styles.sensorAdvice, { color: theme.sub }]}>{item.advice}</Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function InfoScreen() {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.primaryBorder }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Orchard Management Guide</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Banner Section */}
        <View style={[styles.banner, { backgroundColor: theme.bannerBg }]}>
          <Text style={[styles.bannerTitle, { color: theme.bannerText }]}>
            High-Density Apple Orchards
          </Text>
          <Text style={[styles.bannerSub, { color: theme.bannerText }]}>
            Kashmir Temperate Zone (M9 & M26 Rootstocks)
          </Text>
        </View>

        {/* How the sensor works */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionHead}>
            <Info size={18} color="#3b82f6" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Sensor Interpretation</Text>
          </View>
          <Text style={[styles.bodyText, { color: theme.sub }]}>
            This system utilizes a capacitive soil moisture sensor to measure the soil dielectric constant. 
            Unlike resistive sensors, capacitive sensors feature inverted readings:
          </Text>
          
          <View style={styles.formulaBox}>
            <View style={styles.formulaRow}>
              <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
              <Text style={[styles.formulaText, { color: theme.text }]}>
                High Raw Sensor Values &rarr; Dry Soil Condition
              </Text>
            </View>
            <View style={styles.formulaRow}>
              <View style={[styles.dot, { backgroundColor: '#3b82f6' }]} />
              <Text style={[styles.formulaText, { color: theme.text }]}>
                Low Raw Sensor Values &rarr; High Soil Saturation
              </Text>
            </View>
          </View>

          <Text style={[styles.bodyText, { color: theme.sub, marginTop: 8 }]}>
            The system automatically converts raw data into a readable percentage, calibrating 100% as fully saturated and 0% as dry.
          </Text>
        </View>

        {/* Moisture Quick Reference */}
        <Text style={[styles.groupLabel, { color: theme.sub }]}>MOISTURE THRESHOLD REFERENCE</Text>
        {SENSOR_GUIDE.map((item, i) => (
          <SensorRow key={i} item={item} theme={theme} />
        ))}

        {/* Seasonal Guide */}
        <Text style={[styles.groupLabel, { color: theme.sub }]}>SEASONAL IRRIGATION GUIDELINES</Text>
        {SEASONS.map(s => (
          <SeasonCard key={s.id} season={s} theme={theme} />
        ))}

        {/* High-density tips */}
        <Text style={[styles.groupLabel, { color: theme.sub }]}>BEST PRACTICES & TECHNICAL RECOMMENDATIONS</Text>
        {HDAO_TIPS.map((item, i) => (
          <View key={i} style={[styles.tipRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.tipIcon}>{item.icon}</View>
            <Text style={[styles.tipText, { color: theme.text }]}>{item.tip}</Text>
          </View>
        ))}

        {/* Disclaimer */}
        <View style={[styles.disclaimer, { borderColor: theme.border, backgroundColor: theme.card }]}>
          <AlertTriangle size={16} color={theme.sub} style={{ marginRight: 10, marginTop: 2 }} />
          <Text style={[styles.disclaimerText, { color: theme.sub }]}>
            Values and recommendations are adapted from agricultural research guidelines for Kashmiri temperate apple orchards. Actual irrigation needs vary with cultivar, specific valley soil composition (Inceptisols/Spodosols), microclimates, and elevation. Always consult local horticulture experts for field-specific irrigation management.
          </Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Themes ──────────────────────────────────────────────────────────────────

const lightTheme = {
  bg: '#f4f6f0',
  card: '#ffffff',
  text: '#1a2e1c',
  sub: '#6b7b6e',
  border: '#e8eceb',
  primaryBorder: '#c9dece',
  bannerBg: '#1e2420',
  bannerText: '#e8ede9',
};

const darkTheme = {
  bg: '#141a15',
  card: '#1e2720',
  text: '#e8ede9',
  sub: '#8a9e8d',
  border: '#2a3a2d',
  primaryBorder: '#2a3a2d',
  bannerBg: '#0d1410',
  bannerText: '#e8ede9',
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 40 },
  
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  // Banner
  banner: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  bannerSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    opacity: 0.75,
  },

  // Section box
  section: {
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 20,
  },
  formulaBox: {
    marginVertical: 12,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
  },
  formulaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  formulaText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Group labels
  groupLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },

  // Sensor rows
  sensorRow: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  sensorRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 12,
  },
  statusLabelText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sensorRange: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  sensorRaw: {
    fontSize: 11,
    fontWeight: '500',
  },
  sensorAdvice: {
    fontSize: 12,
    lineHeight: 18,
  },

  // Season cards
  seasonCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  seasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seasonIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  seasonName: {
    fontSize: 13,
    fontWeight: '600',
  },
  seasonMonths: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  seasonDetails: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  noteBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 18,
  },

  // Tips
  tipRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    alignItems: 'flex-start',
  },
  tipIcon: {
    marginRight: 12,
    marginTop: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },

  // Disclaimer
  disclaimer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
  },
});
