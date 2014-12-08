module Riemann::Dash::BrowserConfig

  def self.backend
    @backend
  end

  def self.backend=(backend)
    @backend = backend
  end

  # Merge two configs together
  def self.merge_configs(a, b)
    a.merge 'server'      => (a['server']      or b['server']),
            'server_type' => (a['server_type'] or b['server_type']),
            'workspaces'  => merge_workspaces(a['workspaces'], b['workspaces'])
  end

  def self.read
    backend.read
  end

  def self.update(update)
    backend.update(update)
  end

  # TODO: this is gonna take significant restructuring of the dashboard itself,
  # but we should move to http://arxiv.org/abs/1201.1784 or equivalent CRDTs.

  # Given a function to extract a key from an element, and a list of elements,
  # returns a map of keys to elements. Keys are assumed unique.
    def self.index_by(keyfn, list)
      list.reduce({}) do |index, element|
        index[keyfn.call(element)] = element
        index
      end
    end

    # Merges two lists, given a key function which determines equivalent
    # elements, and a merge function to combine equivalent elements.
    def self.merge_lists(keyfn, mergefn, as, bs)
      asi = index_by keyfn, as
      bsi = index_by keyfn, bs
      ids = (as + bs).map(&keyfn).uniq.map do |key|
        mergefn.call asi[key], bsi[key]
      end
    end

    # Merge two workspaces together
    def self.merge_workspace(a, b)
      # TODO: workspace versions
      return a unless b
      return b unless a
      if (a['view']['version'] || 0) < (b['view']['version'] || 0)
        b
      else
        a
      end
    end

    # Merge a list of workspaces together
    def self.merge_workspaces(as, bs)
      return as unless bs
      return bs unless as

      merge_lists(lambda { |x| x['name'] },
                  method(:merge_workspace),
                  as,
                  bs)
    end
end
