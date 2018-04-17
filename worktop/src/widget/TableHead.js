import React from 'react'
import PropTypes from 'prop-types'

import {
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel
} from 'material-ui/Table'
import Checkbox from 'material-ui/Checkbox'

const EnhancedTableHead = props => {
  const createSortHandler = columnId => event => {
    props.onRequestSort(columnId)
  }

  const {
    order,
    orderBy,
    columns,
    numSelected,
    rowCount,
    onSelectAllClick
  } = props

  return (
    <TableHead>
      <TableRow>
        {rowCount !== undefined && (
          <TableCell padding="none" style={{ width: 40 }}>
            <Checkbox
              indeterminate={numSelected > 0 && numSelected < rowCount}
              checked={numSelected > 0 && numSelected === rowCount}
              onChange={onSelectAllClick}
            />
          </TableCell>
        )}

        {columns.map(column => (
          <TableCell
            key={column.id}
            padding={column.disablePadding ? 'none' : 'default'}
            sortDirection={orderBy === column.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === column.id}
              direction={order}
              onClick={createSortHandler(column.id)}
            >
              {column.label}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  )
}

EnhancedTableHead.propTypes = {
  onRequestSort: PropTypes.func.isRequired,
  order: PropTypes.string.isRequired,
  columns: PropTypes.array.isRequired,
  orderBy: PropTypes.string.isRequired,

  /**
   * The following props are related only to rows with checkboxes
   */
  onSelectAllClick: PropTypes.func,
  numSelected: PropTypes.number,
  rowCount: PropTypes.number
}

export default EnhancedTableHead
