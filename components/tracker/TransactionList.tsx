import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Plus, Receipt, TrendingDown, TrendingUp, Trash2 } from 'lucide-react-native';
import { CardEntry } from '@/types/tracker';

interface TransactionListProps {
  entries: CardEntry[];
  cardType: 'myciti' | 'golden_arrow';
  onAddEntry: () => void;
  onDeleteEntry?: (entryId: string) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ 
  entries, 
  cardType,
  onAddEntry,
  onDeleteEntry 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'purchase': return <TrendingUp size={18} color="#10b981" />;
      case 'ride': return <TrendingDown size={18} color="#ef4444" />;
      default: return <TrendingUp size={18} color="#666" />;
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'purchase': return 'Card Loaded';
      case 'ride': return 'Ride Used';
      default: return action;
    }
  };

  const getPointsName = () => {
    return cardType === 'myciti' ? 'points' : 'rides';
  };

  const renderEntryItem = ({ item }: { item: CardEntry }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        {getActionIcon(item.action)}
      </View>
      
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionTitle}>
          {getActionText(item.action)}
        </Text>
        <Text style={styles.transactionDate}>
          {formatDate(item.date)} • {formatTime(item.created_at)}
        </Text>
        {item.notes && (
          <Text style={styles.transactionNote}>{item.notes}</Text>
        )}
      </View>

      <View style={styles.transactionAmount}>
        <Text style={[
          styles.amountText,
          item.action === 'purchase' ? styles.positiveAmount : styles.negativeAmount
        ]}>
          {item.action === 'purchase' ? '+' : '-'}{item.amount}
        </Text>
        <Text style={styles.balanceText}>
          {item.balance_after} {getPointsName()}
        </Text>
      </View>

      {onDeleteEntry && (
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => onDeleteEntry(item.id)}
        >
          <Trash2 size={16} color="#666" />
        </TouchableOpacity>
      )}
    </View>
  );

  if (entries.length === 0) {
    return (
      <View style={styles.transactionSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Text style={styles.seeAllText}>0 entries</Text>
        </View>

        <View style={styles.emptyState}>
          <Receipt size={48} color="#666" />
          <Text style={styles.emptyTitle}>No Activity Yet</Text>
          <Text style={styles.emptySubtitle}>
            Add your first entry to start tracking
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={onAddEntry}
          >
            <Plus size={20} color="#ffffff" />
            <Text style={styles.emptyButtonText}>Add Entry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.transactionSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Text style={styles.seeAllText}>{entries.length} entries</Text>
      </View>

      <FlatList
        data={entries.slice(0, 10)}
        renderItem={renderEntryItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={styles.transactionsList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  transactionSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  seeAllText: {
    fontSize: 14,
    color: '#666',
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  transactionNote: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  transactionAmount: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  positiveAmount: {
    color: '#10b981',
  },
  negativeAmount: {
    color: '#ef4444',
  },
  balanceText: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default TransactionList;