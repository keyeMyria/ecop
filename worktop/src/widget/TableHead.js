import React from 'react'
import PropTypes from 'prop-types'

import {
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel
} from 'material-ui/Table'

const EnhancedTableHead = props => {
  const createSortHandler = property => event => {
    props.onRequestSort(event, property)
  }

  const { order, orderBy, columns } = props

  return (
    <TableHead>
      <TableRow>
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
  orderBy: PropTypes.string.isRequired
}

export default EnhancedTableHead
