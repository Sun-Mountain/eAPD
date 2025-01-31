import { shallow } from 'enzyme';
import React from 'react';

import {
  plain as ExecutiveSummaryReadOnly,
  mapStateToProps
} from './ExecutiveSummaryReadOnly';

const mockPush = jest.fn();

jest.mock('react-router-dom', () => {
  return {
    useHistory: jest.fn().mockReturnValue({ push: () => mockPush() }),
    useRouteMatch: jest.fn().mockReturnValue({ path: '---path---' }),
    useParams: jest.fn().mockReturnValue({ apdId: '0123456789abcdef01234560' })
  };
});

describe('executive summary component', () => {
  const props = {
    apdId: '0123456789abcdef01234567',
    data: [
      {
        key: 'a1',
        name: 'activity 1',
        summary: 'first activity',
        combined: 950,
        federal: 1050,
        medicaid: 1150,
        ffys: {
          1: {
            total: 5232,
            federal: 2883,
            medicaidShare: 23626
          },
          2: {
            total: 848622,
            federal: 826,
            medicaidShare: 2468252
          }
        }
      },
      {
        key: 'a2',
        name: '',
        summary: 'second activity',
        combined: 310,
        federal: 2050,
        medicaid: 2150,
        ffys: {
          1: {
            total: 26926,
            federal: 2356,
            medicaidShare: 989264
          },
          2: {
            total: 54634738,
            federal: 643,
            medicaidShare: 73
          }
        }
      }
    ],
    jumpAction: jest.fn(),
    total: {
      combined: 10,
      federal: 20,
      medicaid: 30,
      ffys: {
        1: {
          total: 5232,
          federal: 2883,
          medicaidShare: 23626
        },
        2: {
          total: 848622,
          federal: 826,
          medicaidShare: 2468252
        }
      }
    },
    years: ['1', '2']
  };

  it('renders correctly', () => {
    const component = shallow(<ExecutiveSummaryReadOnly {...props} />);
    expect(component).toMatchSnapshot();
  });

  it('maps state to props', () => {
    const state = {
      apd: {
        data: {
          activities: [
            {
              key: 'a1',
              name: 'activity 1',
              // Hiram Revels is seated to the United States Senate
              plannedEndDate: '1870-02-25',
              // Shirley Chisholm is seated to the United States House of Representatives
              plannedStartDate: '1969-01-03',
              summary: 'first activity'
            },
            {
              key: 'a2',
              name: '',
              summary: 'second activity'
            }
          ],
          years: ['1', '2']
        }
      },
      budget: {
        activities: {
          a1: {
            costsByFFY: {
              1: 'a1 ffy 1 costs',
              2: 'a1 ffy 2 costs',
              total: { federal: 1050, medicaidShare: 1150, total: 950 }
            }
          },
          a2: {
            costsByFFY: {
              1: 'a2 ffy 1 costs',
              2: 'a2 ffy 2 costs',
              total: { federal: 410, medicaidShare: 510, total: 310 }
            }
          }
        },
        combined: {
          1: 'ffy 1 combined costs',
          2: 'ffy 2 combined costs',
          total: { federal: 1360, medicaid: 1460, total: 1260 }
        }
      }
    };

    expect(mapStateToProps(state)).toEqual({
      data: [
        {
          key: 'a1',
          dateRange: '1/3/1969 - 2/25/1870',
          name: 'activity 1',
          summary: 'first activity',
          combined: 950,
          federal: 1050,
          medicaid: 1150,
          ffys: {
            1: 'a1 ffy 1 costs',
            2: 'a1 ffy 2 costs'
          }
        },
        {
          key: 'a2',
          dateRange: 'Date not specified - Date not specified',
          name: '',
          summary: 'second activity',
          combined: 310,
          federal: 410,
          medicaid: 510,
          ffys: {
            1: 'a2 ffy 1 costs',
            2: 'a2 ffy 2 costs'
          }
        }
      ],
      total: {
        combined: 1260,
        federal: 1360,
        medicaid: 1460,
        ffys: {
          1: 'ffy 1 combined costs',
          2: 'ffy 2 combined costs'
        }
      },
      years: ['1', '2']
    });
  });
});
