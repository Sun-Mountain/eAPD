import PropType from 'prop-types';
import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import TagManager from 'react-gtm-module';

import ApdList from '../components/ApdList';
import AffiliationStatus from '../components/AffiliationStatus';
import { getUserStateOrTerritoryStatus } from '../reducers/user.selector';
import { AFFILIATION_STATUSES } from '../constants';

const StateDashboard = ({ state, role, approvalStatus }) => {
  TagManager.dataLayer({
    dataLayer: {
      stateId: state ? state.id : null,
      userRole: role
    }
  });

  const isApproved = approvalStatus === AFFILIATION_STATUSES.APPROVED;

  return (
    <Fragment>
      {isApproved && <ApdList />}
      {!isApproved && <AffiliationStatus />}
    </Fragment>
  );
};

StateDashboard.propTypes = {
  state: PropType.object.isRequired,
  role: PropType.string.isRequired,
  approvalStatus: PropType.string.isRequired
};

const mapStateToProps = state => ({
  state: state.user.data.state || null,
  role: state.user.data.role || 'Pending Role',
  approvalStatus:
    getUserStateOrTerritoryStatus(state) || AFFILIATION_STATUSES.REQUESTED
});

export default connect(mapStateToProps)(StateDashboard);

export { StateDashboard as plain, mapStateToProps };
