import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { ActivityData } from '@/types/tracker';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface ActivityGraphProps {
  data: ActivityData[];
  selectedYear: number;
  onYearChange: (year: number) => void;
  color?: string;
  isDesktop?: boolean;
}

const ActivityGraph: React.FC<ActivityGraphProps> = ({ 
  data, 
  selectedYear,
  onYearChange,
  color = '#1ea2b1',
  isDesktop = false
}) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2024 + 1 }, (_, i) => 2024 + i);
  
  const generateGitHubGrid = () => {
    const grid = [];
    const startDate = new Date(selectedYear, 0, 1);
    const endDate = new Date(selectedYear, 11, 31);
    
    const startOfWeek = new Date(startDate);
    startOfWeek.setDate(startDate.getDate() - startDate.getDay());
    
    const cellSize = isDesktop ? 14 : 12;
    
    for (let week = 0; week < 53; week++) {
      const weekData = [];
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + (week * 7) + day);
        
        const dateString = currentDate.toISOString().split('T')[0];
        const activity = data.find(d => d.date === dateString);
        
        weekData.push({
          date: dateString,
          level: activity?.level || 0,
          count: activity?.count || 0
        });
      }
      grid.push(weekData);
    }
    
    return grid;
  };

  const grid = generateGitHubGrid();
  
  const getActivityColor = (level: number) => {
    const colors = [
      '#2a2a2a', // No activity (darker for dark theme)
      `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.3)`, // Low
      `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.5)`, // Medium
      `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.7)`, // High
      color,  // Very high (full color)
    ];
    return colors[level] || colors[0];
  };

  // Generate month labels for the activity graph
  const getMonthLabels = () => {
    const months = [];
    const startDate = new Date(selectedYear, 0, 1);
    const startOfWeek = new Date(startDate);
    startOfWeek.setDate(startDate.getDate() - startDate.getDay());
    
    for (let week = 0; week < 53; week++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + (week * 7));
      
      // Only show label for the first week of each month
      if (currentDate.getDate() <= 7) {
        const monthName = currentDate.toLocaleDateString('en-US', { month: 'short' });
        months.push({
          weekIndex: week,
          month: monthName
        });
      }
    }
    
    return months;
  };

  const monthLabels = getMonthLabels();

  if (isDesktop) {
    return (
      <View style={styles.activityGraphDesktop}>
        <View style={styles.graphHeaderDesktop}>
          <View style={styles.headerLeft}>
            <Calendar size={24} color={color} />
            <Text style={styles.graphTitleDesktop}>
              Usage Activity - {selectedYear}
            </Text>
          </View>
          <View style={styles.yearSelectorDesktop}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => onYearChange(selectedYear - 1)}
              disabled={selectedYear <= years[0]}
            >
              <ChevronLeft size={20} color={selectedYear <= years[0] ? '#444' : color} />
            </TouchableOpacity>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearScroll}>
              {years.map(year => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearButtonDesktop,
                    selectedYear === year && styles.selectedYearButtonDesktop
                  ]}
                  onPress={() => onYearChange(year)}
                >
                  <Text style={[
                    styles.yearButtonTextDesktop,
                    selectedYear === year && styles.selectedYearButtonTextDesktop
                  ]}>
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => onYearChange(selectedYear + 1)}
              disabled={selectedYear >= years[years.length - 1]}
            >
              <ChevronRight size={20} color={selectedYear >= years[years.length - 1] ? '#444' : color} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Graph Container */}
        <View style={styles.graphContainerDesktop}>
          {/* Week Labels */}
          <View style={styles.weekLabelsDesktop}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
              <Text key={index} style={styles.weekLabelDesktop}>{day}</Text>
            ))}
          </View>
          
          {/* Graph with Month Labels */}
          <View style={styles.graphWithMonths}>
            {/* Month Labels */}
            <View style={styles.monthLabelsContainerDesktop}>
              {monthLabels.map((monthLabel, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.monthLabelContainerDesktop,
                    { left: monthLabel.weekIndex * 16 }
                  ]}
                >
                  <Text style={styles.monthLabelDesktop}>{monthLabel.month}</Text>
                </View>
              ))}
            </View>
            
            {/* Activity Grid */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.gridContainerDesktop}>
                {grid.map((week, weekIndex) => (
                  <View key={weekIndex} style={styles.weekColumnDesktop}>
                    {week.map((day, dayIndex) => (
                      <View
                        key={`${weekIndex}-${dayIndex}`}
                        style={[
                          styles.dayCellDesktop,
                          { backgroundColor: getActivityColor(day.level) }
                        ]}
                      />
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
        
        {/* Legend */}
        <View style={styles.graphLegendDesktop}>
          <Text style={styles.legendTextDesktop}>Less</Text>
          {[0, 1, 2, 3, 4].map(level => (
            <View
              key={level}
              style={[
                styles.legendCellDesktop,
                { backgroundColor: getActivityColor(level) }
              ]}
            />
          ))}
          <Text style={styles.legendTextDesktop}>More</Text>
        </View>
      </View>
    );
  }

  // Mobile version
  return (
    <View style={styles.activityGraph}>
      <View style={styles.graphHeader}>
        <Text style={styles.graphTitle}>
          Activity in {selectedYear}
        </Text>
        <View style={styles.yearSelector}>
          {years.map(year => (
            <TouchableOpacity
              key={year}
              style={[
                styles.yearButton,
                selectedYear === year && styles.selectedYearButton
              ]}
              onPress={() => onYearChange(year)}
            >
              <Text style={[
                styles.yearButtonText,
                selectedYear === year && styles.selectedYearButtonText
              ]}>
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Month Labels */}
      <View style={styles.monthLabelsContainer}>
        <View style={styles.monthLabelsSpacer} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.monthLabels}>
            {monthLabels.map((monthLabel, index) => (
              <View 
                key={index} 
                style={[
                  styles.monthLabelContainer,
                  { marginLeft: monthLabel.weekIndex === 0 ? 0 : monthLabel.weekIndex * 14 }
                ]}
              >
                <Text style={styles.monthLabel}>{monthLabel.month}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
      
      <View style={styles.graphContainer}>
        <View style={styles.weekLabels}>
          {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((day, index) => (
            <Text key={index} style={styles.weekLabel}>{day}</Text>
          ))}
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.gridContainer}>
            {grid.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.weekColumn}>
                {week.map((day, dayIndex) => (
                  <View
                    key={`${weekIndex}-${dayIndex}`}
                    style={[
                      styles.dayCell,
                      { backgroundColor: getActivityColor(day.level) }
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
      
      <View style={styles.graphLegend}>
        <Text style={styles.legendText}>Less</Text>
        {[0, 1, 2, 3, 4].map(level => (
          <View
            key={level}
            style={[
              styles.legendCell,
              { backgroundColor: getActivityColor(level) }
            ]}
          />
        ))}
        <Text style={styles.legendText}>More</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Desktop Styles
  activityGraphDesktop: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  graphHeaderDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  graphTitleDesktop: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  yearSelectorDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
  },
  yearScroll: {
    maxWidth: 200,
  },
  yearButtonDesktop: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    marginHorizontal: 4,
  },
  selectedYearButtonDesktop: {
    backgroundColor: '#1ea2b1',
  },
  yearButtonTextDesktop: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedYearButtonTextDesktop: {
    color: '#ffffff',
  },
  graphContainerDesktop: {
    flexDirection: 'row',
  },
  weekLabelsDesktop: {
    marginRight: 16,
    justifyContent: 'space-between',
    paddingVertical: 4,
    width: 40,
  },
  weekLabelDesktop: {
    fontSize: 11,
    color: '#666',
    height: 16,
    marginBottom: 2,
  },
  graphWithMonths: {
    flex: 1,
  },
  monthLabelsContainerDesktop: {
    position: 'relative',
    height: 20,
    marginBottom: 8,
  },
  monthLabelContainerDesktop: {
    position: 'absolute',
    bottom: 0,
  },
  monthLabelDesktop: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    minWidth: 20,
  },
  gridContainerDesktop: {
    flexDirection: 'row',
  },
  weekColumnDesktop: {
    marginRight: 2,
  },
  dayCellDesktop: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginBottom: 2,
  },
  graphLegendDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 24,
    gap: 6,
  },
  legendCellDesktop: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  legendTextDesktop: {
    fontSize: 11,
    color: '#666',
    marginHorizontal: 6,
  },
  
  // Mobile Styles
  activityGraph: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  graphHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  graphTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  yearSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  yearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#2a2a2a',
  },
  selectedYearButton: {
    backgroundColor: '#1ea2b1',
  },
  yearButtonText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedYearButtonText: {
    color: '#ffffff',
  },
  monthLabelsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  monthLabelsSpacer: {
    width: 30,
  },
  monthLabels: {
    flexDirection: 'row',
    height: 16,
  },
  monthLabelContainer: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  monthLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
    minWidth: 20,
  },
  graphContainer: {
    flexDirection: 'row',
  },
  weekLabels: {
    marginRight: 8,
    justifyContent: 'space-between',
    paddingVertical: 2,
    width: 30,
  },
  weekLabel: {
    fontSize: 10,
    color: '#666',
    height: 12,
    marginBottom: 2,
  },
  gridContainer: {
    flexDirection: 'row',
  },
  weekColumn: {
    marginRight: 2,
  },
  dayCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginBottom: 2,
  },
  graphLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 4,
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
    color: '#666',
    marginHorizontal: 4,
  },
});

export default ActivityGraph;