import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import { Alert, ChoiceList, TextField } from '@cmsgov/design-system';
import { connect } from 'react-redux';
import DeleteModal from '../../../components/DeleteModal';

import { useForm, Controller } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';

import apdOverviewSchema from '@cms-eapd/common/schemas/apdOverview';

import {
  addYear,
  removeYear,
  setApdName,
  setNarrativeForHIE,
  setNarrativeForHIT,
  setNarrativeForMMIS,
  setProgramOverview
} from '../../../redux/actions/editApd';
import RichText from '../../../components/RichText';
import Instruction from '../../../components/Instruction';
import { Section } from '../../../components/Section';
import { t } from '../../../i18n';

import { selectSummary } from '../../../redux/selectors/apd.selectors';
import { getAllFundingSources } from '../../../redux/selectors/activities.selectors';

const ApdOverview = ({
  addApdYear,
  name,
  narrativeHIE,
  narrativeHIT,
  narrativeMMIS,
  programOverview,
  removeApdYear,
  setHIE,
  setHIT,
  setMMIS,
  setName,
  setOverview,
  years,
  yearOptions,
  fundingSources,
  adminCheck
}) => {
  const [elementDeleteFFY, setElementDeleteFFY] = useState(null);

  const {
    control,
    formState: { errors },
    setValue,
    trigger
  } = useForm({
    defaultValues: {
      fundingSources,
      programOverview,
      narrativeHIT,
      narrativeHIE,
      narrativeMMIS
    },
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: joiResolver(apdOverviewSchema)
  });

  useEffect(() => {
    if (adminCheck) {
      trigger();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const changeName = ({ target: { value } }) => {
    setName(value);
  };

  const onBlur = e => {
    const apdNameInput = e.target.value;

    if (apdNameInput.trim() === '') {
      setName('Untitled APD');
    } else {
      setName(apdNameInput);
    }
  };

  const onRemove = () => {
    removeApdYear(elementDeleteFFY.value);
    setElementDeleteFFY(null);
  };

  const onCancel = () => {
    setElementDeleteFFY(null);
    elementDeleteFFY.checked = true;
  };

  const handleYears = e => {
    const year = e.target.value;

    if (e.target.checked === false) {
      setElementDeleteFFY(e.target);
    } else {
      addApdYear(year);
      e.target.checked = true;
    }
  };

  const handleProgramOverview = html => {
    setOverview(html);
    setValue('programOverview', html);
  };

  const handleHIEOverview = html => {
    setHIE(html);
    setValue('narrativeHIE', html);
  };

  const handleHITOverview = html => {
    setHIT(html);
    setValue('narrativeHIT', html);
  };

  const handleMMISOverview = html => {
    setMMIS(html);
    setValue('narrativeMMIS', html);
  };

  const yearChoices = yearOptions.map(year => ({
    defaultChecked: years.includes(year),
    label: year,
    value: year
  }));

  const getLabelElement = () => {
    if (years.length > 0) {
      return t('apd.overview.instruction.short');
    }
    return (
      <React.Fragment>
        {t('apd.overview.instruction.short')}
        <Alert variation="error">
          <div style={{ fontWeight: 400 }}>
            At least one FFY must be selected to continue with your APD. Select
            your FFY(s).
          </div>
        </Alert>
      </React.Fragment>
    );
  };

  return (
    <Section resource="apd">
      <hr className="custom-hr" />
      <TextField
        className="remove-clearfix"
        label="APD Name"
        name="apd-name"
        onChange={changeName}
        onBlur={onBlur}
        value={name}
      />
      <div className="ds-u-margin-y--3">
        <ChoiceList
          choices={yearChoices}
          label={getLabelElement()}
          labelClassName="ds-u-margin-bottom--1"
          name="apd-years"
          onChange={handleYears}
          type="checkbox"
        />
      </div>
      <div className="ds-u-margin-y--3">
        <Instruction
          labelFor="program-introduction-field"
          source="apd.introduction.instruction"
        />
        <Controller
          name="programOverview"
          control={control}
          render={({ field: { ...props } }) => (
            <RichText
              {...props}
              id="program-introduction-field"
              content={programOverview}
              onSync={handleProgramOverview}
              editorClassName="rte-textarea-l"
              error={errors?.programOverview?.message}
            />
          )}
        />
      </div>
      <div className="ds-u-margin-bottom--3">
        <Instruction
          labelFor="hit-overview-field"
          source="apd.hit.instruction"
        />
        <Controller
          name="narrativeHIT"
          control={control}
          render={({ field: { ...props } }) => (
            <RichText
              {...props}
              id="hit-overview-field"
              content={narrativeHIT}
              onSync={handleHITOverview}
              editorClassName="rte-textarea-l"
              error={errors?.narrativeHIT?.message}
            />
          )}
        />
      </div>
      <div className="ds-u-margin-bottom--3">
        <Instruction
          labelFor="hie-overview-field"
          source="apd.hie.instruction"
        />
        <Controller
          name="narrativeHIE"
          control={control}
          render={({ field: { ...props } }) => (
            <RichText
              {...props}
              id="hie-overview-field"
              content={narrativeHIE}
              onSync={handleHIEOverview}
              editorClassName="rte-textarea-l"
              error={errors?.narrativeHIE?.message}
            />
          )}
        />
      </div>
      <div>
        <Instruction
          labelFor="mmis-overview-field"
          source="apd.mmis.instruction"
        />
        <Controller
          name="narrativeMMIS"
          control={control}
          render={({ field: { ...props } }) => (
            <RichText
              {...props}
              id="mmis-overview-field"
              content={narrativeMMIS}
              onSync={handleMMISOverview}
              editorClassName="rte-textarea-l"
              error={errors?.narrativeMMIS?.message}
            />
          )}
        />
      </div>
      {elementDeleteFFY && (
        <DeleteModal objType="FFY" onCancel={onCancel} onDelete={onRemove} />
      )}
    </Section>
  );
};

ApdOverview.propTypes = {
  addApdYear: PropTypes.func.isRequired,
  removeApdYear: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  narrativeHIE: PropTypes.string.isRequired,
  narrativeHIT: PropTypes.string.isRequired,
  narrativeMMIS: PropTypes.string.isRequired,
  programOverview: PropTypes.string.isRequired,
  setHIE: PropTypes.func.isRequired,
  setHIT: PropTypes.func.isRequired,
  setMMIS: PropTypes.func.isRequired,
  setName: PropTypes.func.isRequired,
  setOverview: PropTypes.func.isRequired,
  years: PropTypes.arrayOf(PropTypes.string).isRequired,
  yearOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  fundingSources: PropTypes.array,
  adminCheck: PropTypes.bool
};

ApdOverview.defaultProps = {
  fundingSources: ['HIT'],
  adminCheck: false
};

const mapStateToProps = state => ({
  fundingSources: getAllFundingSources(state),
  adminCheck: state.apd.adminCheck,
  ...selectSummary(state)
});

const mapDispatchToProps = {
  addApdYear: addYear,
  removeApdYear: removeYear,
  setHIE: setNarrativeForHIE,
  setHIT: setNarrativeForHIT,
  setMMIS: setNarrativeForMMIS,
  setName: setApdName,
  setOverview: setProgramOverview
};

export default connect(mapStateToProps, mapDispatchToProps)(ApdOverview);

export { ApdOverview as plain, mapStateToProps, mapDispatchToProps };
