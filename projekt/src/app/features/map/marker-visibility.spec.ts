import { Marker } from '../../core/models/marker.model';
import { visibleMarkers } from './marker-visibility';

const marker = (id: string, layer: 'overworld' | 'underground', categoryId: string): Marker => ({
  id,
  layer,
  categoryId,
  x: 0,
  y: 0,
  name: id,
});

describe('visibleMarkers', () => {
  const all: Marker[] = [
    marker('a', 'overworld', 'bosses'),
    marker('b', 'overworld', 'merchants'),
    marker('c', 'underground', 'bosses'),
  ];

  it('keeps only markers on the requested layer', () => {
    const result = visibleMarkers(all, 'overworld', []);
    expect(result.map((m) => m.id)).toEqual(['a', 'b']);
  });

  it('drops markers whose category is hidden', () => {
    const result = visibleMarkers(all, 'overworld', ['merchants']);
    expect(result.map((m) => m.id)).toEqual(['a']);
  });

  it('returns nothing when every visible category is hidden', () => {
    expect(visibleMarkers(all, 'overworld', ['bosses', 'merchants'])).toEqual([]);
  });

  it('does not mutate its inputs', () => {
    const hidden = ['bosses'];
    visibleMarkers(all, 'underground', hidden);
    expect(hidden).toEqual(['bosses']);
    expect(all).toHaveLength(3);
  });
});
