import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { ActivityData } from '@/types/tracker';

interface ActivityGraphProps {
  data: ActivityData[];
  selectedYear: number;
  onYearChange: (year: number) => void;
}

const ActivityGraph: React.FC<ActivityGraphProps> = ({ 
  data, 
  selectedYear,
  onYearChange 
}) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2020 + 1 }, (_, i) => 2020 + i);
  
  const generateGitHubGrid = () => {
    const grid = [];
    const startDate = new Date(selectedYear, 0, 1);
    const endDate = new Date(selectedYear, 11, 31);
    
    const startOfWeek = new Date(startDate);
    startOfWeek.setDate(startDate.getDate() - startDate.getDay());
    
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
      '#ebedf0', // No activity
      '#9be9a8', // Low
      '#40c463', // Medium
      '#30a14e', // High
      '#216e39'  // Very high
    ];
    return colors[level] || colors[0];
  };

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
  graphContainer: {
    flexDirection: 'row',
  },
  weekLabels: {
    marginRight: 8,
    justifyContent: 'space-between',
    paddingVertical: 2,
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