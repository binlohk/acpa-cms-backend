import React, { memo } from 'react';
import { Helmet } from 'react-helmet';
import PropTypes from 'prop-types';

import favicon from '../../KLLogo_nobg.png';

const PageTitle = ({ title }) => (
    <Helmet title="嘉林財俊" link={[{ rel: 'icon', type: 'image/png', href: favicon }]} />
);

PageTitle.propTypes = {
    title: PropTypes.string.isRequired,
};

export default memo(PageTitle);
